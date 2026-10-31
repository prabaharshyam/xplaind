// Browser-only stop progress, the chosen path and the "Free only" preference (RM-7 to RM-9) for a
// signed-out learner. Slice S5 copies this into stop_progress on sign-in, so the
// record mirrors that table. Holds stop ids and choices only, no personal data.
import type { ProgressMap, StopProgress } from "@/lib/roadmap/types";
import { syncLastStop, syncPath, syncStop } from "./account-sync";
import { read, write } from "./storage";

export { serverSnapshot, subscribe } from "./storage";

export const PROGRESS_KEY = "xplaind.progress.v1";

/** A roadmap stage's project, keyed by `projectKey(path, stage)`. Kept on this device only. */
export type ProjectProgress = {
  status: "building" | "done";
  url?: string;
  /** GP-2: indexes of guide steps ticked, and rubric criteria the learner says they meet. */
  steps?: number[];
  rubric?: number[];
  updatedOn: string;
};

/** AC-6: the lesson opened last, so the learner can carry on from it. `at` is an ISO time. */
export type LastStop = { stopId: string; at: string };

/** `path` is the id of the path the learner chose; absent until they choose one. */
export type SavedProgress = {
  version: 1;
  stops: ProgressMap;
  freeOnly: boolean;
  path?: string;
  projects?: Record<string, ProjectProgress>;
  last?: LastStop;
};

const EMPTY: SavedProgress = { version: 1, stops: {}, freeOnly: false };

export const rawProgress = (): string | null => read(PROGRESS_KEY);

export function parseProgress(raw: string | null): SavedProgress {
  if (!raw) return EMPTY;
  try {
    const v = JSON.parse(raw) as SavedProgress;
    if (!v || v.version !== 1 || typeof v.stops !== "object" || v.stops === null) return EMPTY;
    const path = typeof v.path === "string" && /^[a-z0-9-]{1,64}$/.test(v.path) ? v.path : undefined;
    const projects = parseProjects(v.projects);
    const last = parseLast(v.last);
    return {
      version: 1,
      stops: v.stops,
      freeOnly: v.freeOnly === true,
      ...(path ? { path } : {}),
      ...(projects ? { projects } : {}),
      ...(last ? { last } : {}),
    };
  } catch {
    return EMPTY;
  }
}

export function parseLast(raw: unknown): LastStop | undefined {
  const v = raw as Partial<LastStop> | null;
  return v && typeof v.stopId === "string" && /^[a-z0-9-]{1,80}$/.test(v.stopId) && typeof v.at === "string" && !Number.isNaN(Date.parse(v.at))
    ? { stopId: v.stopId, at: v.at }
    : undefined;
}

function parseProjects(raw: unknown): Record<string, ProjectProgress> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const out: Record<string, ProjectProgress> = {};
  for (const [key, p] of Object.entries(raw as Record<string, Partial<ProjectProgress>>)) {
    if ((p?.status === "building" || p?.status === "done") && typeof p.updatedOn === "string") {
      const ints = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter((n): n is number => Number.isInteger(n) && n >= 0 && n < 50))].sort((a, b) => a - b) : undefined);
      const steps = ints(p.steps);
      const rubric = ints(p.rubric);
      out[key] = {
        status: p.status,
        updatedOn: p.updatedOn,
        ...(typeof p.url === "string" ? { url: p.url } : {}),
        ...(steps?.length ? { steps } : {}),
        ...(rubric?.length ? { rubric } : {}),
      };
    }
  }
  return Object.keys(out).length ? out : undefined;
}

function update(change: (p: SavedProgress) => SavedProgress): void {
  write(PROGRESS_KEY, JSON.stringify(change(parseProgress(rawProgress()))));
}

export function setStop(stopId: string, record: StopProgress): void {
  update((p) => ({ ...p, stops: { ...p.stops, [stopId]: record } }));
  syncStop(stopId, record);
}

export function clearStop(stopId: string): void {
  update((p) => {
    const stops = { ...p.stops };
    delete stops[stopId];
    return { ...p, stops };
  });
  syncStop(stopId, null);
}

/** Replaces all stops with the merged copy from the server, without sending anything back. */
export const replaceStops = (stops: ProgressMap): void => update((p) => ({ ...p, stops }));

export const setFreeOnly = (freeOnly: boolean): void => update((p) => ({ ...p, freeOnly }));

export function setPath(path: string): void {
  update((p) => ({ ...p, path }));
  syncPath(path);
}

/** AC-6: remembers the lesson just opened, here and (signed in) on the account. */
export function setLastStop(stopId: string, at = new Date().toISOString()): void {
  update((p) => ({ ...p, last: { stopId, at } }));
  syncLastStop(stopId);
}

/** Keeps whichever of this device's and the account's last lesson is newer, without sending. */
export function mergeLastStop(server: LastStop | null): void {
  if (!server) return;
  update((p) => (!p.last || Date.parse(server.at) > Date.parse(p.last.at) ? { ...p, last: server } : p));
}

/** Saves a stage project's state, or clears it with null. */
export function setProject(key: string, record: ProjectProgress | null): void {
  update((p) => {
    const projects = { ...p.projects };
    if (record) projects[key] = record;
    else delete projects[key];
    return { ...p, projects };
  });
}
