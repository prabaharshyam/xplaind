// RM-7, RM-8 and the owner's "percent covered". Pure.
import { type LevelId, levelIndex } from "@/lib/levels";
import type { DoneHow, ProgressMap, RoadmapStop, StopProgress, StopStatus } from "./types";

/** RM-7: a check passes at 70% or more. */
export const CHECK_PASS_PERCENT = 70;

export function statusOf(progress: ProgressMap, stopId: string): StopStatus {
  return progress[stopId]?.status ?? "not_started";
}

/** Done stops, including self-skipped ones (RM-8 counts a skip as done). */
export function completedIds(progress: ProgressMap): Set<string> {
  return new Set(Object.entries(progress).filter(([, p]) => p.status === "done").map(([id]) => id));
}

/** Percent correct, rounded down, so 69.9 never shows as a pass. */
export function checkPercent(correct: number, total: number): number {
  if (!(total > 0) || correct < 0 || correct > total) throw new RangeError("need 0 <= correct <= total and total > 0");
  return Math.floor((correct * 100) / total);
}

export const passesCheck = (percent: number): boolean => percent >= CHECK_PASS_PERCENT;

/** The record to store after a check. A fail keeps the stop in progress and keeps the best score. */
export function afterCheck(previous: StopProgress | undefined, percent: number, today: string): StopProgress {
  if (previous?.status === "done") return { ...previous, score: Math.max(previous.score ?? 0, percent), updatedOn: today };
  return passesCheck(percent)
    ? { status: "done", how: "check", score: percent, updatedOn: today }
    : { status: "in_progress", score: Math.max(previous?.score ?? 0, percent), updatedOn: today };
}

export function markDone(how: Exclude<DoneHow, "check">, today: string, projectUrl?: string): StopProgress {
  return how === "project" ? { status: "done", how, projectUrl, updatedOn: today } : { status: "done", how, updatedOn: today };
}

/** A project link must be a web address the learner could share. */
export function isProjectUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}

export type Coverage = { doneHours: number; totalHours: number; percent: number; done: number; skipped: number; total: number };

/**
 * Percent of the path covered, weighted by stop hours and measured from the start
 * level up. Stops below the start level are review only and do not count.
 */
export function coverage(stops: readonly RoadmapStop[], startLevel: LevelId, progress: ProgressMap): Coverage {
  const onPath = stops.filter((s) => levelIndex(s.level) >= levelIndex(startLevel));
  let doneHours = 0;
  let done = 0;
  let skipped = 0;
  for (const s of onPath) {
    const p = progress[s.id];
    if (p?.status !== "done") continue;
    doneHours += s.hours;
    done += 1;
    if (p.how === "self_skipped") skipped += 1;
  }
  const totalHours = onPath.reduce((sum, s) => sum + s.hours, 0);
  const percent = totalHours === 0 ? 0 : Math.floor((doneHours * 100) / totalHours);
  return { doneHours, totalHours, percent, done, skipped, total: onPath.length };
}
