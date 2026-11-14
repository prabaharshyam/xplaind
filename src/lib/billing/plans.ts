// PAY-1: the Pro passes and the daily AI limits for each kind of visitor. Pure, so the pricing
// page, the AI guard and tests share one set of numbers. Prices are in paise (₹1 = 100 paise).
import type { AiKind } from "@/lib/ai/limits";

export const PLAN_IDS = ["pass_week", "pass_month", "pass_6month", "pass_year"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type Plan = { id: PlanId; name: string; months: number; days: number; paise: number; note: string; popular?: boolean };

export const PLANS: Record<PlanId, Plan> = {
  // PAY-11 (2026-11-14, owner decision): a small first purchase, full Pro for a week.
  pass_week: { id: "pass_week", name: "7-day pass", months: 0, days: 7, paise: 9_900, note: "For an interview this week" },
  pass_month: { id: "pass_month", name: "30-day pass", months: 1, days: 30, paise: 24_900, note: "Try Pro for a month" },
  pass_6month: { id: "pass_6month", name: "Placement pass, 6 months", months: 6, days: 182, paise: 99_900, note: "One full placement season", popular: true },
  pass_year: { id: "pass_year", name: "Career pass, 12 months", months: 12, days: 365, paise: 149_900, note: "A whole year of steady learning" },
};

export const isPlanId = (v: unknown): v is PlanId => typeof v === "string" && (PLAN_IDS as readonly string[]).includes(v);

/**
 * PAY-8 (2026-11-13, owner decision): the longer passes show their saving against buying the 30-day
 * pass month after month, the only reference price that is real (never an invented "was" price).
 * Pure, for the pricing page and tests.
 */
export const monthlyEquivalentPaise = (p: Plan): number => PLANS.pass_month.paise * p.months;
export const savingPercent = (p: Plan): number => Math.round((1 - p.paise / monthlyEquivalentPaise(p)) * 100);
/** "₹5.5": the price per day, one decimal below ₹10. */
export const perDay = (p: Plan): string => {
  const r = p.paise / 100 / p.days;
  return `₹${r < 10 ? (Math.round(r * 10) / 10).toString() : Math.round(r).toString()}`;
};

/** ₹249, ₹999. */
/** Whole rupees as ₹1,499; part rupees always with two decimals, as ₹124.50. */
export const rupees = (paise: number) =>
  `₹${new Intl.NumberFormat("en-IN", paise % 100 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : {}).format(paise / 100)}`;

/** Who is asking, for the AI limits: a visitor without an account, a signed-in learner, or a learner with a pass. */
export type Tier = "guest" | "free" | "pro";

/**
 * Daily AI turns per feature once Pro is open (PAY-1). Fast, cheap features (the tutor and Ask your notes)
 * get the most; reviews that run on the strongest model get fewer. Pro limits are generous but
 * real, so one learner cannot run up a bill bigger than their pass.
 */
export const TIER_LIMITS: Record<Tier, Record<AiKind, number>> = {
  /** Visitors without an account (only while sign-ups are on hold; AG-1 asks them to sign up). Never more than the free trial. */
  guest: { tutor: 2, grade: 1, interview: 1, book: 1, resume: 1, notes: 2 },
  /** PAY-7: for free accounts these are a one-time trial per feature, not a daily allowance. */
  free: { tutor: 3, grade: 3, interview: 2, book: 2, resume: 2, notes: 3 },
  pro: { tutor: 50, grade: 20, interview: 5, book: 10, resume: 3, notes: 100 },
};

/** Plain names for the pricing table and the usage counter. */
export const KIND_LABEL: Record<AiKind, string> = {
  tutor: "AI tutor questions",
  grade: "Interview answer feedback",
  interview: "Full mock interview reports",
  book: "Tests or flashcards from your notes",
  notes: "Questions about your notes",
  resume: "Resume reviews",
};

/**
 * The daily limit for one feature. Before Pro opens, everyone keeps the one set of limits the site
 * has always had (`before`), so turning payments on is the only thing that changes them.
 */
export function dailyLimit(kind: AiKind, tier: Tier, proOpen: boolean, before: Record<AiKind, number>): number {
  return proOpen ? TIER_LIMITS[tier][kind] : before[kind];
}

/**
 * PAY-7 (2026-11-13, owner decision): once Pro is open, a free account gets a one-time trial of each
 * AI helper (TIER_LIMITS.free), not a daily allowance. What is left today is the trial minus every
 * use on earlier days; the daily guard then stops today's uses at that number, so the lifetime total
 * never passes the trial. Pure, for tests.
 */
export const trialLeftToday = (trial: number, usedBeforeToday: number): number => Math.max(0, trial - Math.max(0, usedBeforeToday));

/** A new order id: "xp_", the time in base 36 and random letters. Cashfree allows 3 to 45 of [A-Za-z0-9_-]. */
export function newOrderId(now: number, random: string): string {
  return `xp_${now.toString(36)}_${random.replace(/[^A-Za-z0-9]/g, "").slice(0, 16)}`;
}

/** True while a pass runs. `now` is passed in so this stays pure. */
export const passIsActive = (validUntil: string | null | undefined, nowMs: number): boolean =>
  Boolean(validUntil) && new Date(validUntil as string).getTime() > nowMs;
