// RZ-1: starts a Pro pass purchase with Razorpay Standard Checkout. Same rules as the Cashfree
// order (PAY-3): a signed-in learner with an 18+ profile, consent to the terms, and an amount that
// comes from the plan on the server, never from the browser. We store our order (plan and amount
// only), create the Razorpay order with our order id as its receipt, and return what the checkout needs.
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { json, problem, rateLimit, readJson, requireSession } from "@/lib/account/http";
import { proOpen, razorpayConfig } from "@/lib/billing/config";
import { PLANS, PLAN_IDS, newOrderId } from "@/lib/billing/plans";
import { checkPromo, discountedPaise } from "@/lib/billing/promo";
import { createRazorpayOrder, MIN_PAISE } from "@/lib/billing/razorpay";

const Body = z.strictObject({ planId: z.enum(PLAN_IDS), agree: z.literal(true), promo: z.string().max(40).optional() });

export async function POST(request: Request) {
  const config = razorpayConfig();
  if (!config || !proOpen()) return problem(503, "Pro passes are not on sale yet.");
  const session = await requireSession();
  if (session instanceof Response) return session;

  const limited = await rateLimit(session.admin, `order:${session.user.id}`, 600, 10);
  if (limited) return limited;
  const parsed = Body.safeParse(await readJson(request, 1_000).catch(() => null));
  if (!parsed.success) return problem(400, "Choose a pass and tick the box to agree to the terms.");

  const { data: profile } = await session.admin.from("profiles").select("id").eq("id", session.user.id).maybeSingle();
  if (!profile) return problem(403, "Please finish setting up your account, and confirm you are 18 or older, before buying a pass.");

  const plan = PLANS[parsed.data.planId];
  // PAY-9: a promo code, checked on the server; the discounted amount is priced here, never by the browser.
  let promo: { code: string; percentOff: number } | null = null;
  if (parsed.data.promo?.trim()) {
    const check = await checkPromo(session.admin, parsed.data.promo, plan.id, session.user.id);
    if (!check.ok) return problem(400, check.reason);
    promo = check;
  }
  const amount = discountedPaise(plan.paise, promo?.percentOff ?? 0);
  if (amount > 0 && amount < MIN_PAISE) return problem(400, "That amount is too small to pay online.");
  const orderId = newOrderId(Date.now(), randomBytes(12).toString("base64url"));
  const { error } = await session.admin.from("payments").insert({
    order_id: orderId,
    user_id: session.user.id,
    plan_id: plan.id,
    amount_paise: amount,
    environment: config.mode,
    ...(promo ? { promo_code: promo.code, discount_percent: promo.percentOff } : {}),
  });
  if (error) return problem(500, "Could not start the payment. Please try again.");

  // PAY-9: 100% off needs no payment; the pass starts now and the code is used up in the same step.
  if (amount === 0) {
    const { data: granted, error: grantError } = await session.admin.rpc("grant_pass", { p_order: orderId, p_cf_payment: null, p_now: new Date().toISOString() });
    if (granted === "used") return problem(400, "You have already used this promo code.");
    if (grantError || (granted !== "granted" && granted !== "already")) return problem(500, "Could not start your pass. Please try again or contact us.");
    return json({ free: true, receipt: orderId });
  }

  const created = await createRazorpayOrder(config, { amountPaise: amount, receipt: orderId, notes: { plan: plan.id, ...(promo ? { promo: promo.code } : {}) } });
  if (!created.ok) {
    await session.admin.from("payments").update({ status: "failed" }).eq("order_id", orderId);
    // A 401 from Razorpay means our keys are wrong: a problem on our side, so the learner is not sent to sign in.
    if (created.status === 401) return problem(500, "Payments are not set up correctly. Please try again later or contact us.");
    return problem(500, "The payment service did not answer. Please try again in a minute.");
  }
  return json({
    order_id: created.order.id,
    amount: created.order.amount,
    currency: created.order.currency,
    key_id: config.keyId,
    receipt: orderId,
    mode: config.mode,
    email: session.user.email ?? null,
    description: `Xplaind ${plan.name}`,
  });
}
