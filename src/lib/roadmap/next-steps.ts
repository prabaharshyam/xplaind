// RM-3: the next five steps. Pure: start level, gap tags and completed stops in,
// an ordered list out. Never reads resources, so it cannot read affiliate fields (ED-2).
import { type LevelId, levelIndex } from "@/lib/levels";
import type { NextStep, RoadmapStop } from "./types";

export const NEXT_STEPS = 5;
export const MAX_REVIEW_STEPS = 2;

/**
 * `stops` are one path's lessons in the order the path lists them. Up to two review
 * stops for the learner's gaps come first (gap order kept, the first stop at or below
 * the start level that covers the tag), then incomplete stops at or above the start
 * level, in path order. No stop appears twice. On a path with no level test, pass
 * the lowest level so nothing is skipped.
 */
export function nextSteps(input: {
  stops: readonly RoadmapStop[];
  startLevel: LevelId;
  gapTags: readonly string[];
  completed: ReadonlySet<string>;
  count?: number;
}): NextStep[] {
  const { stops, startLevel, gapTags, completed, count = NEXT_STEPS } = input;
  const start = levelIndex(startLevel);
  const open = stops.filter((s) => !completed.has(s.id));
  const out: NextStep[] = [];
  const taken = new Set<string>();

  for (const tag of gapTags) {
    if (out.length >= Math.min(MAX_REVIEW_STEPS, count)) break;
    const stop = open.find((s) => levelIndex(s.level) <= start && s.gap_tags.includes(tag) && !taken.has(s.id));
    if (!stop) continue;
    out.push({ stopId: stop.id, reason: "review", gapTag: tag });
    taken.add(stop.id);
  }

  for (const stop of open) {
    if (out.length >= count) break;
    if (levelIndex(stop.level) < start || taken.has(stop.id)) continue;
    out.push({ stopId: stop.id, reason: "next" });
    taken.add(stop.id);
  }
  return out;
}

/** The review stop for one gap tag (PL-4), done or not. Used by the result page's gap list. */
export function reviewStopFor<T extends RoadmapStop>(stops: readonly T[], startLevel: LevelId, tag: string): T | undefined {
  return stops.find((s) => levelIndex(s.level) <= levelIndex(startLevel) && s.gap_tags.includes(tag));
}
