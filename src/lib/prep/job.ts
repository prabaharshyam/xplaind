// PREP-5, PREP-6 (2026-11-26, owner decisions): the job the learner is preparing for. All of it stays
// on the device (the owner chose that over the account): the company type, the pasted job post, which
// bank questions the post points at, and the questions written for it by AI with their ratings.
// Pure: no network, no database, no React.
import { z } from "zod";

/**
 * The kind of company, and what it changes in a plan. Deliberately small: how often a behavioural
 * question appears, and whether system design questions come earlier. It makes no claim about what
 * any one company asks.
 */
export const COMPANY_TYPES = [
  { id: "product", label: "Product company", everyBehavioural: 4, designFirst: true },
  { id: "service", label: "IT services or consulting company", everyBehavioural: 3, designFirst: false },
  { id: "startup", label: "Startup", everyBehavioural: 5, designFirst: false },
  { id: "bigtech", label: "Large global tech company", everyBehavioural: 4, designFirst: true },
] as const;
export type CompanyId = (typeof COMPANY_TYPES)[number]["id"];
export const COMPANY_IDS = COMPANY_TYPES.map((c) => c.id) as [CompanyId, ...CompanyId[]];
export const companyOf = (id: string | null | undefined) => COMPANY_TYPES.find((c) => c.id === id) ?? null;

export const MAX_JD_CHARS = 8000;
/** A job post shorter than this is not enough for the AI to write questions from. */
export const MIN_JD_CHARS = 150;
/** Questions the AI writes for one job post. */
export const GENERATED_COUNT = 10;

/** A question written by AI for the learner's job post. Never part of the reviewed bank; ids are "jd-1" and up. */
export const GeneratedQuestion = z.strictObject({
  id: z.string().regex(/^jd-\d{1,2}$/),
  question: z.string().min(15).max(300),
  short_answer: z.string().min(40).max(700),
  deeper_answer: z.string().min(40).max(1800),
});
export type GeneratedQuestion = z.infer<typeof GeneratedQuestion>;
export const isGeneratedId = (id: string) => /^jd-\d{1,2}$/.test(id);

const Rating = z.strictObject({ rating: z.union([z.literal(0), z.literal(1), z.literal(2)]), updatedOn: z.iso.date() });

/** What the device keeps about the job. */
export const PrepJob = z.strictObject({
  company: z.enum(COMPANY_IDS).nullable(),
  jd: z.string().max(MAX_JD_CHARS),
  /** Bank questions the job post points at, best match first. */
  boost: z.array(z.string().max(80)).max(400),
  generated: z.array(GeneratedQuestion).max(GENERATED_COUNT),
  /** Ratings of the generated questions. They never go to the account: the bank does not know these ids. */
  ratings: z.record(z.string().regex(/^jd-\d{1,2}$/), Rating),
});
export type PrepJob = z.infer<typeof PrepJob>;
export const NO_JOB: PrepJob = { company: null, jd: "", boost: [], generated: [], ratings: {} };

/** Shorter terms ("AI", "ML") are in every job post and say nothing about this one. */
const MIN_TERM_CHARS = 3;
/** A term that marks more than this share of the bank says nothing about one job ("model", "data"). */
const TOO_COMMON = 0.15;

/**
 * PREP-5: the bank questions a job post points at, best match first, with no AI. A question matches when
 * the post names one of its terms (its lesson's key terms and their other spellings) as a whole word or
 * phrase. Rare terms count for more, and terms most of the bank shares are ignored.
 */
export function jobBoost(jd: string, questions: readonly { id: string; terms: readonly string[] }[]): string[] {
  // Lowercase words, keeping the signs inside names like "c++", "c#" and "node.js", but not a full stop that ends a sentence.
  // Longer words lose a common ending, so "fine-tune" meets "fine-tuning" and "embedding" meets "embeddings".
  const stem = (w: string) => (w.length >= 4 ? w.replace(/(ing|ed|es|s|e)$/, "") : w);
  const norm = (t: string) =>
    t
      .toLowerCase()
      .replace(/[^a-z0-9+#.]+/g, " ")
      .replace(/\.(?= |$)/g, " ")
      .trim()
      .split(/ +/)
      .map(stem)
      .join(" ");
  const text = ` ${norm(jd)} `;
  const uses = new Map<string, number>();
  for (const q of questions) for (const t of new Set(q.terms.map(norm))) uses.set(t, (uses.get(t) ?? 0) + 1);
  const found = new Map<string, boolean>();
  const inPost = (t: string) => {
    if (!found.has(t)) found.set(t, t.length >= MIN_TERM_CHARS && text.includes(` ${t} `));
    return found.get(t)!;
  };
  return questions
    .map((q, i) => {
      let score = 0;
      for (const t of new Set(q.terms.map(norm))) if (uses.get(t)! <= questions.length * TOO_COMMON && inPost(t)) score += 1 / uses.get(t)!;
      return { id: q.id, score, i };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.id);
}

/** PREP-6: the generated questions placed early in the plan, one after every third bank question. */
export function withGenerated(ids: readonly string[], generated: readonly string[]): string[] {
  const out: string[] = [];
  let g = 0;
  ids.forEach((id, i) => {
    out.push(id);
    if ((i + 1) % 3 === 0 && g < generated.length) out.push(generated[g++]);
  });
  return [...out, ...generated.slice(g)];
}
