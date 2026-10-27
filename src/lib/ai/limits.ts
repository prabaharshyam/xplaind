// CO-1: what AI calls may cost. Pure: no network, no database. The owner set a
// US$20 monthly cap; per-learner daily caps keep one account from using it up.

export const AI_KINDS = ["roadmap", "course", "course-lesson", "coach", "tutor", "grade", "interview", "bot", "book"] as const;
export type AiKind = (typeof AI_KINDS)[number];

/** Calls one learner may make per India day, per feature. Grades follow the PRD's 5 (CO-1). */
export const DAILY_LIMIT: Record<AiKind, number> = {
  roadmap: 5,
  course: 3,
  "course-lesson": 12,
  coach: 20,
  tutor: 30,
  grade: 5,
  /** A whole mock interview reviewed in one call. */
  interview: 3,
  /** X Bot, the site helper that floats on every page (XB-3). */
  bot: 30,
  /** "Ask me from my book": one call writes a whole test (MB-2). */
  book: 5,
};

export const DEFAULT_MODEL = "claude-opus-5-5";
export const DEFAULT_MONTHLY_CAP_USD = 20;

/** US dollars per million tokens. Checked 2026-10-26 on Anthropic's pricing page. */
export const PRICES: Record<string, { input: number; output: number }> = {
  "claude-opus-5-5": { input: 4, output: 20 },
  "claude-opus-5": { input: 5, output: 25 },
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-fable-5-1": { input: 10, output: 50 },
};

/** Used for any model not in the table, so an unknown model is never counted as cheap. */
const WORST_CASE = { input: 10, output: 50 };

export type TokenUse = { model: string; input: number; output: number };

/** Cost of one call. A call that fell back to another model lists each attempt separately. */
export function costUsd(uses: TokenUse[]): number {
  let total = 0;
  for (const u of uses) {
    const p = PRICES[u.model] ?? WORST_CASE;
    total += (u.input * p.input + u.output * p.output) / 1_000_000;
  }
  return Math.round(total * 1_000_000) / 1_000_000;
}

/** The first day of the India month that `day` (YYYY-MM-DD) is in. */
export const monthStart = (day: string) => `${day.slice(0, 7)}-01`;

/** Reads a positive number from a setting, or the fallback when it is missing or not a number. */
export function positiveNumber(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return value !== undefined && value.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : fallback;
}

export const LIMIT_MESSAGE = {
  day: "You have used today's AI turns for this feature. They reset at midnight India time, so try again tomorrow.",
  month: "This month's AI allowance is used up. It resets on the 1st. Everything else on Xplaind still works.",
  off: "AI features are switched off for now. Everything else on Xplaind still works.",
} as const;

type UsageLike = {
  input_tokens: number;
  output_tokens: number;
  iterations?: ReadonlyArray<{ input_tokens?: number; output_tokens?: number; model?: string | null }> | null;
};

/** Token use per model from a response's usage. Each fallback attempt is billed at its own model's price. */
export function tokenUses(usage: UsageLike, requestedModel: string): TokenUse[] {
  const its = usage.iterations?.filter((i) => typeof i.input_tokens === "number" || typeof i.output_tokens === "number") ?? [];
  if (its.length === 0) return [{ model: requestedModel, input: usage.input_tokens, output: usage.output_tokens }];
  return its.map((i) => ({ model: i.model ?? requestedModel, input: i.input_tokens ?? 0, output: i.output_tokens ?? 0 }));
}
