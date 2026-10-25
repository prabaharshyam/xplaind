// Time estimate shown on the result page (PL-5). Pure.
import { type LevelId, levelIndex } from "@/lib/levels";

export const WEEKLY_HOUR_CHOICES = [3, 5, 10, 15, 20] as const;
export const DEFAULT_WEEKLY_HOURS = 5;

/** Draft hours from the start level up to P3, counting the start level. */
export function hoursFromLevel(
  levels: readonly { id: LevelId; draft_hours: number }[],
  startLevel: LevelId,
): number {
  return levels
    .filter((l) => levelIndex(l.id) >= levelIndex(startLevel))
    .reduce((sum, l) => sum + l.draft_hours, 0);
}

/** Whole weeks needed at a steady weekly pace. */
export function weeksAtPace(hours: number, weeklyHours: number): number {
  if (!(weeklyHours > 0)) throw new RangeError("weeklyHours must be above 0");
  return Math.ceil(hours / weeklyHours);
}
