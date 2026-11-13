// PAY-9: checks a promo code before paying, so the pay window can show the price after the discount.
// Only says whether this account may use the code on this pass, and the price. Nothing is reserved:
// the code is used up only when the order is paid (create-order checks it again).
import { z } from "zod";
import { json, problem, rateLimit, readJson, requireSession } from "@/lib/account/http";
import { proOpen, razorpayConfig } from "@/lib/billing/config";
import { PLANS, PLAN_IDS } from "@/lib/billing/plans";
import { checkPromo, discountedPaise } from "@/lib/billing/promo";

const Body = z.strictObject({ planId: z.enum(PLAN_IDS), code: z.string().max(40) });

export async function POST(request: Request) {
  if (!razorpayConfig() || !proOpen()) return problem(503, "Pro passes are not on sale yet.");
  const session = await requireSession();
  if (session instanceof Response) return session;
  // Tight limit, so codes cannot be guessed by trying many.
  const limited = await rateLimit(session.admin, `promo:${session.user.id}`, 600, 10);
  if (limited) return limited;
  const parsed = Body.safeParse(await readJson(request, 500).catch(() => null));
  if (!parsed.success) return problem(400, "That promo code is not valid.");

  const check = await checkPromo(session.admin, parsed.data.code, parsed.data.planId, session.user.id);
  if (!check.ok) return problem(400, check.reason);
  const plan = PLANS[parsed.data.planId];
  return json({ code: check.code, percentOff: check.percentOff, amount: discountedPaise(plan.paise, check.percentOff), was: plan.paise });
}
