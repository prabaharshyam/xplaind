// PAY-3: the two Cashfree Payment Gateway calls we need, over plain HTTPS. Node only.
// Docs: https://www.cashfree.com/docs/api-reference/payments/latest/orders/create
import type { PaymentsConfig } from "./config";

const API_VERSION = "2026-01-01";

const headers = (c: PaymentsConfig) => ({
  "Content-Type": "application/json",
  "x-api-version": API_VERSION,
  "x-client-id": c.appId,
  "x-client-secret": c.secret,
});

export type NewOrder = {
  orderId: string;
  rupees: number;
  customerId: string;
  phone: string;
  email: string | null;
  returnUrl: string;
  notifyUrl: string;
  note: string;
};

/** Creates the order and returns the session id the browser checkout needs, or null on failure. */
export async function createOrder(c: PaymentsConfig, o: NewOrder): Promise<string | null> {
  const res = await fetch(`${c.baseUrl}/orders`, {
    method: "POST",
    headers: { ...headers(c), "x-idempotency-key": crypto.randomUUID() },
    body: JSON.stringify({
      order_id: o.orderId,
      order_amount: o.rupees,
      order_currency: "INR",
      order_note: o.note,
      customer_details: { customer_id: o.customerId, customer_phone: o.phone, ...(o.email ? { customer_email: o.email } : {}) },
      order_meta: { return_url: o.returnUrl, notify_url: o.notifyUrl },
    }),
    signal: AbortSignal.timeout(20_000),
  }).catch(() => null);
  if (!res?.ok) return null;
  const data = (await res.json().catch(() => null)) as { payment_session_id?: string } | null;
  return data?.payment_session_id ?? null;
}

export type OrderState = { status: "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED" | "TERMINATION_REQUESTED" | string; rupees: number; currency: string };

/** Asks Cashfree for the order. The only source we trust for whether it was paid. */
export async function fetchOrder(c: PaymentsConfig, orderId: string): Promise<OrderState | null> {
  const res = await fetch(`${c.baseUrl}/orders/${encodeURIComponent(orderId)}`, { headers: headers(c), signal: AbortSignal.timeout(20_000) }).catch(() => null);
  if (!res?.ok) return null;
  const d = (await res.json().catch(() => null)) as { order_status?: string; order_amount?: number; order_currency?: string } | null;
  return d?.order_status && typeof d.order_amount === "number" ? { status: d.order_status, rupees: d.order_amount, currency: d.order_currency ?? "INR" } : null;
}

/** The successful payment's id on an order, for the receipt. */
export async function paidPaymentId(c: PaymentsConfig, orderId: string): Promise<string | null> {
  const res = await fetch(`${c.baseUrl}/orders/${encodeURIComponent(orderId)}/payments`, { headers: headers(c), signal: AbortSignal.timeout(20_000) }).catch(() => null);
  if (!res?.ok) return null;
  const list = (await res.json().catch(() => null)) as { cf_payment_id?: string | number; payment_status?: string }[] | null;
  const paid = Array.isArray(list) ? list.find((p) => p.payment_status === "SUCCESS") : undefined;
  return paid?.cf_payment_id !== undefined ? String(paid.cf_payment_id) : null;
}
