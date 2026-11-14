// IR-1 (2026-11-14, owner decision): interview readiness per role. Pure, for the API and tests.

/** One reviewed mock interview's score out of 100: the average answer score (each 0 to 5). */
export function sessionScore(answerScores: number[]): number | null {
  if (answerScores.length === 0) return null;
  const mean = answerScores.reduce((a, b) => a + b, 0) / answerScores.length;
  return Math.round((mean / 5) * 100);
}

export type Readiness = { score: number; change: number | null; sessions: number };

/**
 * Readiness from scores newest first: the average of the latest three, and how much it moved
 * against the three before (null until there are four or more).
 */
export function readiness(newestFirst: number[]): Readiness | null {
  if (newestFirst.length === 0) return null;
  const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
  const recent = newestFirst.slice(0, 3);
  const before = newestFirst.slice(3, 6);
  const score = avg(recent);
  return { score, change: before.length ? score - avg(before) : null, sessions: newestFirst.length };
}

/** The words for a readiness score, so a number always comes with what it means. */
export function readinessLabel(score: number): string {
  if (score >= 80) return "Interview-ready";
  if (score >= 60) return "Nearly there";
  if (score >= 40) return "Getting there";
  return "Just starting";
}
