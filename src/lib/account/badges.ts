// AC-6: one badge per level passed. Pure.
import { LEVEL_IDS, type LevelId, levelIndex } from "@/lib/levels";

export const levelBadgeId = (level: LevelId) => `level-${level}`;

type StopLite = { id: string; level: LevelId };
type ProgressLite = { stop_id: string; status: string; done_how: string | null };

/**
 * A level is passed by the placement rule (PL-3: the passed level and every
 * level below it) or by completing every stop of the level with a passed check
 * or a submitted project (RM-7). Self-skipped stops do not count: a badge needs
 * proof, and the re-test can contradict a skip (RM-8).
 */
export function earnedLevelBadges(input: {
  passedLevels: readonly (LevelId | null)[];
  stops: readonly StopLite[];
  progress: readonly ProgressLite[];
}): string[] {
  const earned = new Set<LevelId>();
  for (const passed of input.passedLevels) {
    if (!passed) continue;
    for (const l of LEVEL_IDS) if (levelIndex(l) <= levelIndex(passed)) earned.add(l);
  }
  const proven = new Set(
    input.progress.filter((p) => p.status === "done" && (p.done_how === "check" || p.done_how === "project")).map((p) => p.stop_id),
  );
  for (const level of LEVEL_IDS) {
    const stops = input.stops.filter((s) => s.level === level);
    if (stops.length > 0 && stops.every((s) => proven.has(s.id))) earned.add(level);
  }
  return LEVEL_IDS.filter((l) => earned.has(l)).map(levelBadgeId);
}
