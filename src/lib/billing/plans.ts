// PAY-1: the Pro passes and the daily AI limits for each kind of visitor. Pure, so the pricing
// page, the AI guard and tests share one set of numbers. Prices are in paise (₹1 = 100 paise).
import type { AiKind } from "@/lib/ai/limits";

export const PLAN_IDS = ["pass_month", "pass_6month", "pass_year"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type Plan = { id: PlanId; name: string; months: number; paise: number; note: string; popular?: boolean };

export const PLANS: Record<PlanId, Plan> = {
  pass_month: { id: "pass_month", name: "30-day pass", months: 1, paise: 24_900, note: "Try Pro for a month" },
  pass_6month: { id: "pass_6month", name: "Placement pass, 6 months", months: 6, paise: 119_900, note: "₹200 a month, for a placement season", popular: true },
  pass_year: { id: "pass_year", name: "Career pass, 12 months", months: 12, paise: 199_900, note: "₹167 a month, for a year of steady learning" },
};

export const isPlanId = (v: unknown): v is PlanId => typeof v === "string" && (PLAN_IDS as readonly string[]).includes(v);

/** ₹249, ₹1,199. */
export const rupees = (paise: number) => `₹${new Intl.NumberFormat("en-IN").format(paise / 100)}`;

/** Who is asking, for the AI limits: a visitor without an account, a signed-in learner, or a learner with a pass. */
export type Tier = "guest" | "free" | "pro";

/**
 * Daily AI turns per feature once Pro is open (PAY-1). Fast, cheap features (the tutor and Ask your notes)
 * get the most; reviews that run on the strongest model get fewer. Pro limits are generous but
 * real, so one learner cannot run up a bill bigger than their pass.
 */
export const TIER_LIMITS: Record<Tier, Record<AiKind, number>> = {
  guest: { tutor: 5, grade: 2, interview: 1, book: 1, resume: 1, notes: 5 },
  free: { tutor: 10, grade: 3, interview: 1, book: 2, resume: 1, notes: 20 },
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

/** A new order id: "xp_", the time in base 36 and random letters. Cashfree allows 3 to 45 of [A-Za-z0-9_-]. */
export function newOrderId(now: number, random: string): string {
  return `xp_${now.toString(36)}_${random.replace(/[^A-Za-z0-9]/g, "").slice(0, 16)}`;
}

/** True while a pass runs. `now` is passed in so this stays pure. */
export const passIsActive = (validUntil: string | null | undefined, nowMs: number): boolean =>
  Boolean(validUntil) && new Date(validUntil as string).getTime() > nowMs;
