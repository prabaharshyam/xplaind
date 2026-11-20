// CO-1: what AI calls may cost. Pure: no network, no database. The owner set a
// US$20 monthly cap; per-learner daily caps keep one account from using it up.

export const AI_KINDS = ["tutor", "grade", "interview", "book", "resume", "notes", "scan", "voice", "voice_end", "voice_plan", "voice_start", "voice_trial"] as const;
export type AiKind = (typeof AI_KINDS)[number];

/** Calls one learner may make per India day, per feature. Grades follow the PRD's 5 (CO-1). */
export const DAILY_LIMIT: Record<AiKind, number> = {
  /** The AI tutor, in lessons and on its own page (the coach was merged into it). */
  tutor: 40,
  grade: 5,
  /** A whole mock interview reviewed in one call. */
  interview: 3,
  /** "Study from my notes & books": one call writes a whole test or deck of cards (MB-2, MB-5). */
  book: 5,
  /** RV-1: one review of a resume. */
  resume: 5,
  /** MB-8: one question answered from the learner's own notes, on the fast model. */
  notes: 30,
  /** MB-12: one batch of up to 4 picture pages read into text, on the fast model. Pro only (the tiers in plans.ts give guests and free accounts none). */
  scan: 20,
  /**
   * VI-3: the AI voice interviewer. Each follow-up question is one call (fast model) and the scored report is
   * one more (main model), so a 5-question interview is at most 11 calls. Pro only (the tiers in plans.ts
   * give guests and free accounts none, and the route checks Pro before anything is read).
   */
  voice: 40,
  /** VI-10: "has the learner finished?" checks during an AI voice interview, a few tokens each on the fast model. */
  voice_end: 300,
  /** VI-11: an AI interview planned from a pasted job description, one main-model call each. */
  voice_plan: 10,
  /**
   * VI-13: a free account's trial of the AI interviewer, counted only while Pro is open (PAY-7). Before
   * then nobody without a pass gets one, so these are 0 here (the tiers in plans.ts hold the trial).
   * voice_start counts trial interviews started (they mint voice and transcription tokens, which cost
   * Sarvam money); voice_trial counts the trial's one scored report.
   */
  voice_start: 0,
  voice_trial: 0,
};

export const DEFAULT_MODEL = "claude-opus-5-5";
/**
 * PAY-1: the high-volume helpers (the AI tutor and Ask your notes) run on the fast, low-cost model, so
 * daily allowances stay affordable; reviews and grading keep the strongest model (AI_MODEL).
 */
export const DEFAULT_FAST_MODEL = "claude-haiku-5-5";
export const FAST_KINDS: readonly AiKind[] = ["tutor", "notes", "scan", "voice_end"];

/**
 * The model for one call: the fast model for FAST_KINDS, otherwise the main model. A route can ask for
 * either one explicitly (VI-3: the voice interviewer's follow-ups use the fast model, its report the main one).
 */
export function modelFor(kind: AiKind, main: string, fast: string, choice?: "fast" | "main"): string {
  if (choice) return choice === "fast" ? fast : main;
  return FAST_KINDS.includes(kind) ? fast : main;
}

/** Server-side fallback is offered for the larger models only, so the fast model is called without it. */
export const offersFallback = (model: string): boolean => !model.startsWith("claude-haiku");
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
  day: "That was today's last turn for this tool. It resets at midnight India time.",
  /** PAY-7: a free account has used its one-time trial of this feature. */
  trial: "That was your last free try of this tool. Pro includes it every day, from ₹99 for 7 days.",
  /** PAY-4: the same, when a Pro pass would give more today. */
  dayUpgrade: "That was today's last turn for this tool. It resets at midnight India time, or Pro gives you more today.",
  month: "This month's AI allowance is used up. It resets on the 1st. Everything else on Xplaind still works.",
  /** PAY-13: a Pro learner has used their pass's fair-use AI allowance for the last 30 days. */
  allowance: "You have used your pass's AI allowance for the last 30 days. It frees up day by day. Lessons, roadmaps and practice still work as usual.",
  off: "AI features are switched off for now. Everything else on Xplaind still works.",
  /** AG-1: AI needs an account once sign-ups are open. */
  signin: "The AI tools are part of Pro. Create a free account to try each one a few times.",
  /** VI-13: the free AI interview has been used. */
  voiceTrial: "You have had your free AI interview. Pro includes them every day, from ₹99 for 7 days.",
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
