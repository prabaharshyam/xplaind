// PREP-1 (2026-11-26, owner request): a question plan worked back from an interview date. Pure: no
// database, UI or framework imports. Dates are YYYY-MM-DD in India (Asia/Kolkata).
// Only the setup is stored. The question set, today's list and progress are worked out again from the
// setup, the bank, the ratings and today, so a missed day rolls forward without any bookkeeping.
import { z } from "zod";
import { daysBetween } from "@/lib/dates";
import { EXPERIENCE, EXPERIENCE_IDS, type ExperienceId } from "@/lib/interview/setup";
import { LEVEL_IDS, type LevelId } from "@/lib/levels";
import type { Ratings } from "@/lib/practice/queue";
import { companyOf, type CompanyId } from "./job";

/** Minutes a day the learner can give, and the minutes one question takes (think, read both answers, rate). */
export const MINUTES = [30, 60, 90] as const;
export type Minutes = (typeof MINUTES)[number];
export const MINUTES_PER_QUESTION = 6;
export const perDay = (minutes: number): number => Math.floor(minutes / MINUTES_PER_QUESTION);
/** How far ahead an interview date can be. */
export const MAX_DAYS_AHEAD = 365;

/** What is saved for a plan, on the device and in the account. Everything else is worked out from it. */
export const PrepSetupInput = z.strictObject({
  interviewOn: z.iso.date(),
  pathId: z.string().regex(/^[a-z0-9-]{1,64}$/),
  experience: z.enum(EXPERIENCE_IDS),
  minutes: z.union([z.literal(30), z.literal(60), z.literal(90)]),
  startedOn: z.iso.date(),
});
export type PrepSetup = z.infer<typeof PrepSetupInput>;

/**
 * PREP-3: one plan from the device's copy and the account's. The plan started later wins; on a tie the
 * account's does, so an edit made on another device arrives here.
 */
export const pickPrep = (device: PrepSetup | null, server: PrepSetup | null): PrepSetup | null =>
  device && (!server || device.startedOn > server.startedOn) ? device : server;
export type PrepQuestion = { id: string; level: string; topic: string; paths: readonly string[]; /** Asked in almost every interview. */ often?: boolean };

export const addDays = (iso: string, n: number): string => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

/** A behavioural question follows every this many technical ones, at most. */
export const BEHAVIOURAL_EVERY = 4;

export type PrepSet = {
  /** Every question in the plan, most important first. */
  ids: string[];
  /** Technical questions for the role. */
  core: number;
  behavioural: number;
  /** Core questions two or more levels away from the learner's experience. They come last. */
  stretch: number;
  /** PREP-5: questions in the set that the learner's job post points at. They come first. */
  fromJob: number;
};

/**
 * The questions for a role and experience level, most important first: the role's questions nearest the
 * learner's level (its Top 25 first within a level band), with its behavioural questions, also nearest
 * the level first, spread through them so no day is all one kind. Nothing is padded: a role with a
 * small bank gives a small set. Questions the learner's job post points at come before all of these.
 */
export function prepSet(
  all: readonly PrepQuestion[],
  top: readonly string[],
  pathId: string,
  experience: ExperienceId,
  /** PREP-5: the bank questions the learner's job post points at (best first), and the kind of company. */
  job: { boost?: readonly string[]; company?: CompanyId | null } = {},
): PrepSet {
  const company = companyOf(job.company);
  const boostAt = new Map((job.boost ?? []).map((id, i) => [id, i]));
  const boosted = (q: PrepQuestion) => boostAt.get(q.id) ?? boostAt.size;
  const design = (q: PrepQuestion) => (company?.designFirst && q.topic === "system-design" ? 0 : 1);
  const levels = EXPERIENCE.find((e) => e.id === experience)!.levels.map((l) => LEVEL_IDS.indexOf(l as LevelId));
  const [lo, hi] = [Math.min(...levels), Math.max(...levels)];
  const away = (q: PrepQuestion) => {
    const i = LEVEL_IDS.indexOf(q.level as LevelId);
    return i < lo ? lo - i : i > hi ? i - hi : 0;
  };
  const topAt = new Map(top.map((id, i) => [id, i]));
  const rank = (q: PrepQuestion) => topAt.get(q.id) ?? top.length;
  const byFit = (qs: PrepQuestion[]) =>
    qs
      .map((q, i) => ({ q, i }))
      .sort((a, b) => boosted(a.q) - boosted(b.q) || away(a.q) - away(b.q) || design(a.q) - design(b.q) || rank(a.q) - rank(b.q) || a.i - b.i)
      .map((x) => x.q);
  const mine = all.filter((q) => q.paths.includes(pathId));
  // Behavioural: the ones asked in almost every interview first, then by fit like the rest.
  const behavioural = mine.filter((q) => q.topic === "behavioral");
  const soft = [...byFit(behavioural.filter((q) => q.often)), ...byFit(behavioural.filter((q) => !q.often))];
  const core = byFit(mine.filter((q) => q.topic !== "behavioral"));

  // One behavioural question after every few technical ones, never more than one in five, so a short
  // plan still spends its time on the role. The behavioural ones that are left over come last.
  const step = Math.max(company?.everyBehavioural ?? BEHAVIOURAL_EVERY, Math.floor(core.length / Math.max(1, soft.length)));
  const ids: string[] = [];
  let s = 0;
  core.forEach((q, i) => {
    ids.push(q.id);
    if ((i + 1) % step === 0 && s < soft.length) ids.push(soft[s++].id);
  });
  for (; s < soft.length; s++) ids.push(soft[s].id);
  return { ids, core: core.length, behavioural: soft.length, stretch: core.filter((q) => away(q) >= 2 && !boostAt.has(q.id)).length, fromJob: mine.filter((q) => boostAt.has(q.id)).length };
}

export type PrepDay = {
  date: string;
  /** final: the day before, revision only. interview: the day itself. */
  kind: "study" | "final" | "interview";
  /** New questions planned for the day. */
  ids: string[];
  mock: "short" | "full" | null;
};

export type PrepPlan =
  | { status: "past" }
  | {
      status: "ok";
      daysLeft: number;
      total: number;
      /** Questions rated since the plan started. */
      covered: number;
      /** Rated "missed" yesterday or earlier, or "partly" two days ago or earlier: due again today. */
      review: string[];
      /** New questions for today. */
      fresh: string[];
      /** Questions rated today. */
      doneToday: number;
      /** New questions that do not fit before the interview at this pace. The least important are the ones left. */
      leftOut: number;
      /** Today first, the interview day last. */
      days: PrepDay[];
    };

/** A rating counts for the plan only when it was given on or after the day the plan started. */
const inPlan = (ratings: Ratings, startedOn: string) => (id: string) => !!ratings[id] && ratings[id].updatedOn >= startedOn;

/**
 * The plan from today to the interview. Each day holds as many questions as the learner's minutes allow:
 * ones due for revision first, then new ones in order. The day before is revision only (unless it is the
 * only day), and the interview day has no questions. A short mock interview falls on every third day of
 * the plan and a full one two days before the interview.
 *
 * shortcut: revision is "missed comes back the next day, partly after two days", which is all one rating
 * record per question can say. Upgrade to real spaced repetition with IQ-10.
 */
export function prepPlan(setup: PrepSetup, order: readonly string[], ratings: Ratings, today: string): PrepPlan {
  const daysLeft = daysBetween(today, setup.interviewOn);
  if (daysLeft < 0) return { status: "past" };
  const done = inPlan(ratings, setup.startedOn);
  const covered = order.filter(done);
  const remaining = order.filter((id) => !done(id));
  const doneToday = covered.filter((id) => ratings[id].updatedOn === today).length;
  const review = covered
    .filter((id) => ratings[id].rating < 2 && daysBetween(ratings[id].updatedOn, today) >= (ratings[id].rating === 0 ? 1 : 2))
    .sort((a, b) => ratings[a].rating - ratings[b].rating || (ratings[a].updatedOn < ratings[b].updatedOn ? -1 : ratings[a].updatedOn > ratings[b].updatedOn ? 1 : 0));

  const cap = perDay(setup.minutes);
  const fullOn = addDays(setup.interviewOn, -2) > setup.startedOn ? addDays(setup.interviewOn, -2) : setup.startedOn;
  let next = 0;
  const days: PrepDay[] = Array.from({ length: daysLeft + 1 }, (_, i) => {
    const date = addDays(today, i);
    const toGo = daysLeft - i;
    const kind = toGo === 0 ? "interview" : toGo === 1 ? "final" : "study";
    // New questions go on study days, and on the day before only for a plan started that late (it has no study day).
    const takesNew = kind === "study" || (kind === "final" && daysBetween(setup.startedOn, setup.interviewOn) <= 1);
    const room = takesNew ? Math.max(0, i === 0 ? cap - doneToday - review.length : cap) : 0;
    const ids = remaining.slice(next, next + room);
    next += ids.length;
    const dayNo = daysBetween(setup.startedOn, date) + 1;
    const mock = date === fullOn && kind !== "interview" ? "full" : kind === "study" && dayNo % 3 === 0 ? "short" : null;
    return { date, kind, ids, mock };
  });
  return { status: "ok", daysLeft, total: order.length, covered: covered.length, review, fresh: days[0].ids, doneToday, leftOut: remaining.length - next, days };
}

export type PrepReadiness = {
  /** 0 to 100. */
  score: number;
  /** Topics with the smallest share of "got it" among the questions rated, weakest first. */
  weak: { topic: string; gotIt: number; rated: number }[];
};

/**
 * How ready the learner is: a "got it" is a full point and a "partly" half a point, over every question
 * in the plan. When there is a mock interview score for the role it counts for 30%.
 */
export function prepReadiness(questions: readonly PrepQuestion[], ratings: Ratings, startedOn: string, mockScore: number | null): PrepReadiness {
  const done = inPlan(ratings, startedOn);
  const topics = new Map<string, { topic: string; gotIt: number; rated: number }>();
  let points = 0;
  for (const q of questions) {
    if (!done(q.id)) continue;
    const r = ratings[q.id].rating;
    points += r / 2;
    const t = topics.get(q.topic) ?? { topic: q.topic, gotIt: 0, rated: 0 };
    t.rated += 1;
    if (r === 2) t.gotIt += 1;
    topics.set(q.topic, t);
  }
  const fromQuestions = questions.length ? (points / questions.length) * 100 : 0;
  const score = Math.round(mockScore === null ? fromQuestions : fromQuestions * 0.7 + mockScore * 0.3);
  const weak = [...topics.values()]
    .filter((t) => t.gotIt < t.rated)
    .sort((a, b) => a.gotIt / a.rated - b.gotIt / b.rated || b.rated - a.rated)
    .slice(0, 3);
  return { score, weak };
}
