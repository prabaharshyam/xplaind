// Browser-only stop progress and the "Free only" preference (RM-7 to RM-9) for a
// signed-out learner. Slice S5 copies this into stop_progress on sign-in, so the
// record mirrors that table. Holds stop ids and choices only, no personal data.
import type { ProgressMap, StopProgress } from "@/lib/roadmap/types";
import { read, write } from "./storage";

export { serverSnapshot, subscribe } from "./storage";

export const PROGRESS_KEY = "xplaind.progress.v1";

export type SavedProgress = { version: 1; stops: ProgressMap; freeOnly: boolean };

const EMPTY: SavedProgress = { version: 1, stops: {}, freeOnly: false };

export const rawProgress = (): string | null => read(PROGRESS_KEY);

export function parseProgress(raw: string | null): SavedProgress {
  if (!raw) return EMPTY;
  try {
    const v = JSON.parse(raw) as SavedProgress;
    if (!v || v.version !== 1 || typeof v.stops !== "object" || v.stops === null) return EMPTY;
    return { version: 1, stops: v.stops, freeOnly: v.freeOnly === true };
  } catch {
    return EMPTY;
  }
}

function update(change: (p: SavedProgress) => SavedProgress): void {
  write(PROGRESS_KEY, JSON.stringify(change(parseProgress(rawProgress()))));
}

export const setStop = (stopId: string, record: StopProgress): void =>
  update((p) => ({ ...p, stops: { ...p.stops, [stopId]: record } }));

export const clearStop = (stopId: string): void =>
  update((p) => {
    const stops = { ...p.stops };
    delete stops[stopId];
    return { ...p, stops };
  });

export const setFreeOnly = (freeOnly: boolean): void => update((p) => ({ ...p, freeOnly }));
