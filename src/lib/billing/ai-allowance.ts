// PAY-13 (2026-11-20, owner: "whatever is a good profitable strategy, go ahead"): a Pro learner's AI spend is
// capped by what their pass earns Xplaind, so no learner can cost more than they paid. Pure, for the AI guard,
// the pricing page and tests.
import { PLANS, isPlanId } from "./plans";

/** Prices include 18% GST. */
const GST = 1.18;
/** Razorpay's fee (about 2%) plus 18% GST on the fee, as a share of the price. */
const GATEWAY_SHARE = 0.0236;
/** The share of a pass's net revenue its learner's AI calls may cost. The rest is margin and covers Sarvam's voice. */
export const AI_ALLOWANCE_SHARE = 0.6;
/** Every Pro learner gets at least this much a month, so free or comp passes (₹0 paid) still work. */
export const AI_ALLOWANCE_FLOOR_INR = 60;
/** The window the allowance covers; it frees up day by day as older days drop out. */
export const AI_ALLOWANCE_WINDOW_DAYS = 30;
/** For turning the recorded US dollar cost into rupees. Review when the rupee moves a lot. */
export const INR_PER_USD = 88;

/** What Xplaind keeps from a payment, in rupees: price less GST and gateway fees. */
export const netRupees = (paidPaise: number): number => Math.max(0, paidPaise / 100 / GST - (paidPaise / 100) * GATEWAY_SHARE);

/**
 * The AI allowance, in rupees for any 30 days, for a learner whose latest paid pass was `planId` at
 * `paidPaise` (after any promo code). A pass shorter than 30 days gets its whole share; a longer one is
 * spread evenly over its months. Unknown or missing payments (comp passes) get the floor.
 */
export function aiAllowanceInr(paidPaise: number | null | undefined, planId: string | null | undefined): number {
  const days = isPlanId(planId) ? PLANS[planId].days : AI_ALLOWANCE_WINDOW_DAYS;
  const share = netRupees(paidPaise ?? 0) * AI_ALLOWANCE_SHARE * Math.min(1, AI_ALLOWANCE_WINDOW_DAYS / days);
  return Math.max(AI_ALLOWANCE_FLOOR_INR, Math.round(share));
}

/** The same in US dollars, the unit the usage table records. */
export const aiAllowanceUsd = (paidPaise: number | null | undefined, planId: string | null | undefined): number =>
  aiAllowanceInr(paidPaise, planId) / INR_PER_USD;
