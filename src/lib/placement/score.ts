// Scoring and placement (PL-3, PL-4). Pure functions: the same code runs in the
// browser to show the result and on the server to re-score a claimed attempt (PL-6).
import { HIGHEST_LEVEL, LEVEL_IDS, LOWEST_LEVEL, type LevelId, levelIndex, levelUp } from "@/lib/levels";
import type { Answer, LevelTally, PlacementResult } from "./types";

/** A level counts as passed with at least this many answers... */
export const PASS_MIN_ATTEMPTS = 2;
/** ...and at least this share right (two thirds). Compared with integers, never floats. */
export const PASS_RATIO = { numerator: 2, denominator: 3 } as const;
/** PL-4: show at most this many review topics. */
export const MAX_GAPS = 3;

export function tallyByLevel(answers: readonly Answer[]): Record<LevelId, LevelTally> {
  const tally = Object.fromEntries(LEVEL_IDS.map((l) => [l, { attempts: 0, correct: 0 }])) as Record<LevelId, LevelTally>;
  for (const a of answers) {
    tally[a.level].attempts += 1;
    if (a.correct) tally[a.level].correct += 1;
  }
  return tally;
}

export function hasPassed(t: LevelTally): boolean {
  return (
    t.attempts >= PASS_MIN_ATTEMPTS &&
    t.correct * PASS_RATIO.denominator >= t.attempts * PASS_RATIO.numerator
  );
}

/** Highest level where the learner answered at least 2 and got two thirds right. */
export function passedLevel(perLevel: Record<LevelId, LevelTally>): LevelId | null {
  for (let i = LEVEL_IDS.length - 1; i >= 0; i--) {
    if (hasPassed(perLevel[LEVEL_IDS[i]])) return LEVEL_IDS[i];
  }
  return null;
}

/**
 * PL-4. Topic tags of wrong or "I don't know" answers at or below the start level,
 * most frequent first; on a tie the tag missed at the lowest level comes first, then
 * alphabetical order so the result is the same every time.
 */
export function findGaps(answers: readonly Answer[], startLevel: LevelId): string[] {
  const stats = new Map<string, { count: number; lowest: number }>();
  for (const a of answers) {
    if (a.correct || levelIndex(a.level) > levelIndex(startLevel)) continue;
    for (const tag of a.topicTags) {
      const s = stats.get(tag) ?? { count: 0, lowest: Infinity };
      s.count += 1;
      s.lowest = Math.min(s.lowest, levelIndex(a.level));
      stats.set(tag, s);
    }
  }
  return [...stats.entries()]
    .sort(([tagA, a], [tagB, b]) => b.count - a.count || a.lowest - b.lowest || tagA.localeCompare(tagB))
    .slice(0, MAX_GAPS)
    .map(([tag]) => tag);
}

export function scoreAnswers(answers: readonly Answer[]): PlacementResult {
  const perLevel = tallyByLevel(answers);
  const passed = passedLevel(perLevel);
  const topOfLadder = passed === HIGHEST_LEVEL;
  const startLevel = passed === null ? LOWEST_LEVEL : levelUp(passed); // levelUp keeps P3 at P3
  return {
    passedLevel: passed,
    startLevel,
    topOfLadder,
    perLevel,
    gaps: findGaps(answers, startLevel),
    questionsAnswered: answers.length,
  };
}
