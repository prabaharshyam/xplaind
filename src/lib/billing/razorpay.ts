// RZ-1: Razorpay Standard Checkout, server side. The Orders and Payments API calls we need, over
// plain HTTPS with Basic auth, the same way the Cashfree calls are made. Node only: the key secret
// must never reach the browser. Docs: https://razorpay.com/docs/api/orders/ and /api/payments/
import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RazorpayConfig } from "./config";
import type { Confirmed } from "./confirm";
import { PLANS, isPlanId } from "./plans";

const API = "https://api.razorpay.com/v1";
/** Razorpay rejects orders below ₹1. */
export const MIN_PAISE = 100;

const auth = (c: RazorpayConfig) => `Basic ${Buffer.from(`${c.keyId}:${c.secret}`).toString("base64")}`;

async function call<T>(c: RazorpayConfig, path: string, init: RequestInit = {}): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: auth(c), ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(20_000),
  }).catch(() => null);
  if (!res) return { ok: false, status: 0 };
  if (!res.ok) return { ok: false, status: res.status };
  const data = (await res.json().catch(() => null)) as T | null;
  return data ? { ok: true, data } : { ok: false, status: 502 };
}

export type RazorpayOrder = { id: string; amount: number; currency: string; receipt: string | null; status: string };

/**
 * Creates the Razorpay order for one of our orders. `receipt` is our own order id (xp_…), so any
 * Razorpay order can be traced back to the row it pays for. Returns the HTTP status on failure:
 * 401 means the keys are wrong.
 */
export async function createRazorpayOrder(
  c: RazorpayConfig,
  o: { amountPaise: number; receipt: string; notes: Record<string, string> },
): Promise<{ ok: true; order: RazorpayOrder } | { ok: false; status: number }> {
  if (!Number.isInteger(o.amountPaise) || o.amountPaise < MIN_PAISE) return { ok: false, status: 400 };
  const r = await call<RazorpayOrder>(c, "/orders", {
    method: "POST",
    body: JSON.stringify({ amount: o.amountPaise, currency: "INR", receipt: o.receipt, notes: o.notes }),
  });
  return r.ok ? { ok: true, order: r.data } : r;
}

export const fetchRazorpayOrder = (c: RazorpayConfig, id: string) => call<RazorpayOrder>(c, `/orders/${encodeURIComponent(id)}`);

export type RazorpayPayment = { id: string; order_id: string | null; amount: number; currency: string; status: string };

const fetchPayment = (c: RazorpayConfig, id: string) => call<RazorpayPayment>(c, `/payments/${encodeURIComponent(id)}`);
const orderPayments = (c: RazorpayConfig, orderId: string) => call<{ items: RazorpayPayment[] }>(c, `/orders/${encodeURIComponent(orderId)}/payments`);
const capture = (c: RazorpayConfig, p: RazorpayPayment) =>
  call<RazorpayPayment>(c, `/payments/${encodeURIComponent(p.id)}/capture`, { method: "POST", body: JSON.stringify({ amount: p.amount, currency: p.currency }) });

// ------------------------------------------------------------------ signatures --

const hmacHex = (data: string, secret: string) => createHmac("sha256", secret).update(data).digest("hex");

function sameHex(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** What Razorpay signs after a checkout: HMAC-SHA256 of "order_id|payment_id" with the key secret, in hex. Pure. */
export const checkoutSignature = (orderId: string, paymentId: string, secret: string) => hmacHex(`${orderId}|${paymentId}`, secret);

/** True only when the checkout signature is the one Razorpay would make for this order and payment. */
export function checkoutIsGenuine(orderId: string, paymentId: string, signature: string, secret: string): boolean {
  return /^[a-f0-9]{64}$/.test(signature) && sameHex(checkoutSignature(orderId, paymentId, secret), signature);
}

/** Webhooks: HMAC-SHA256 of the raw body with the webhook secret, in hex (X-Razorpay-Signature). */
export function webhookIsGenuine(rawBody: string, signature: string | null, webhookSecret: string): boolean {
  return !!signature && /^[a-f0-9]{64}$/.test(signature) && sameHex(hmacHex(rawBody, webhookSecret), signature);
}

// ---------------------------------------------------------------- confirmation --

/**
 * Confirms a Razorpay order with Razorpay itself and grants the pass. Shared by the checkout's
 * verify call and the webhook, so whichever arrives first grants it and the other finds it done.
 * Never trusts the browser: the order's receipt, amount and currency must match our row and the
 * plan's price, and the payment must belong to the order. An authorised payment is captured here.
 */
export async function confirmRazorpay(
  admin: SupabaseClient,
  c: RazorpayConfig,
  razorpayOrderId: string,
  paymentId: string | null,
  now = new Date(),
): Promise<{ result: Confirmed; orderId: string | null }> {
  const order = await fetchRazorpayOrder(c, razorpayOrderId);
  if (!order.ok) return { result: order.status === 404 || order.status === 400 ? "unknown" : "pending", orderId: null };
  const ours = order.data.receipt;
  if (!ours || !/^xp_[A-Za-z0-9_-]{6,42}$/.test(ours)) return { result: "unknown", orderId: null };

  const { data: row } = await admin.from("payments").select("plan_id, amount_paise, status, environment").eq("order_id", ours).maybeSingle();
  if (!row || !isPlanId(row.plan_id) || row.environment !== c.mode) return { result: "unknown", orderId: ours };
  if (row.status === "paid") return { result: "already", orderId: ours };
  if (order.data.currency !== "INR" || order.data.amount !== row.amount_paise || order.data.amount !== PLANS[row.plan_id].paise) return { result: "unknown", orderId: ours };

  let payment: RazorpayPayment | undefined;
  if (paymentId) {
    const p = await fetchPayment(c, paymentId);
    if (!p.ok) return { result: "pending", orderId: ours };
    payment = p.data;
  } else {
    const list = await orderPayments(c, razorpayOrderId);
    if (!list.ok) return { result: "pending", orderId: ours };
    payment = list.data.items.find((p) => p.status === "captured") ?? list.data.items.find((p) => p.status === "authorized");
  }
  if (!payment || payment.order_id !== razorpayOrderId || payment.amount !== order.data.amount || payment.currency !== "INR") {
    return { result: payment?.status === "failed" ? "failed" : "pending", orderId: ours };
  }
  if (payment.status === "failed") return { result: "failed", orderId: ours };
  if (payment.status === "authorized") {
    const captured = await capture(c, payment);
    if (!captured.ok || captured.data.status !== "captured") return { result: "pending", orderId: ours };
    payment = captured.data;
  }
  if (payment.status !== "captured") return { result: "pending", orderId: ours };

  const { data, error } = await admin.rpc("grant_pass", { p_order: ours, p_cf_payment: payment.id, p_now: now.toISOString() });
  if (error) return { result: "pending", orderId: ours };
  return { result: data === "granted" ? "granted" : data === "already" ? "already" : "unknown", orderId: ours };
}
