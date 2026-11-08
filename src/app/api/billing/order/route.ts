// PAY-3: starts a Pro pass purchase. The learner must be signed in with an 18+ profile (PV-2).
// We store the order (plan and amount only) and ask Cashfree for a checkout session. The phone
// number is required by Cashfree for the payment; we pass it on and do not store it.
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { json, problem, rateLimit, readJson, requireSession } from "@/lib/account/http";
import { createOrder } from "@/lib/billing/cashfree";
import { paymentsConfig, proOpen } from "@/lib/billing/config";
import { PLANS, PLAN_IDS, newOrderId } from "@/lib/billing/plans";
import { siteUrl } from "@/lib/site";

const Body = z.strictObject({
  planId: z.enum(PLAN_IDS),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  agree: z.literal(true),
});

export async function POST(request: Request) {
  const config = paymentsConfig();
  if (!config || !proOpen()) return problem(503, "Pro passes are not on sale yet.");
  const session = await requireSession();
  if (session instanceof Response) return session;

  const limited = await rateLimit(session.admin, `order:${session.user.id}`, 600, 10);
  if (limited) return limited;
  const parsed = Body.safeParse(await readJson(request, 2_000).catch(() => null));
  if (!parsed.success) return problem(400, "Choose a pass, enter a 10-digit Indian mobile number and tick the box.");

  const { data: profile } = await session.admin.from("profiles").select("id").eq("id", session.user.id).maybeSingle();
  if (!profile) return problem(403, "Please finish setting up your account, and confirm you are 18 or older, before buying a pass.");

  const plan = PLANS[parsed.data.planId];
  const orderId = newOrderId(Date.now(), randomBytes(12).toString("base64url"));
  const { error } = await session.admin.from("payments").insert({
    order_id: orderId,
    user_id: session.user.id,
    plan_id: plan.id,
    amount_paise: plan.paise,
    environment: config.mode,
  });
  if (error) return problem(500, "Could not start the payment. Please try again.");

  const sessionId = await createOrder(config, {
    orderId,
    rupees: plan.paise / 100,
    customerId: session.user.id.replace(/-/g, ""),
    phone: parsed.data.phone,
    email: session.user.email,
    returnUrl: `${siteUrl()}/pricing/return?order_id=${orderId}`,
    notifyUrl: `${siteUrl()}/api/billing/webhook`,
    note: `Xplaind ${plan.name}`,
  });
  if (!sessionId) {
    await session.admin.from("payments").update({ status: "failed" }).eq("order_id", orderId);
    return problem(502, "The payment service did not answer. Please try again in a minute.");
  }
  return json({ orderId, paymentSessionId: sessionId, mode: config.mode });
}
