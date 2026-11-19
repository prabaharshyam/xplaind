// ST-1: the days the learner opened Xplaind, kept on this device. A day counts towards the streak
// even if nothing was finished that day, because coming back is the habit the streak rewards.
// Holds dates only.
import { read, write } from "./storage";

export const VISITS_KEY = "xplaind.visits.v1";
/** The last day this device told the server about, so a signed-in learner makes one call a day. */
export const VISIT_SENT_KEY = "xplaind.visit-sent.v1";
const MAX_DAYS = 400;

const isDay = (d: unknown): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);

/** Old days merged with new ones: valid dates only, no repeats, oldest first, the latest 400. Pure. */
export function mergeDays(a: readonly unknown[], b: readonly unknown[]): string[] {
  return [...new Set([...a, ...b].filter(isDay))].sort().slice(-MAX_DAYS);
}

export const rawVisits = (): string | null => read(VISITS_KEY);

export function parseVisits(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as { version?: number; days?: unknown };
    return v?.version === 1 && Array.isArray(v.days) ? mergeDays(v.days, []) : [];
  } catch {
    return [];
  }
}

/** Adds days to the stored list. Writes only when something is new, so it never loops the store's change event. */
export function recordVisits(days: readonly string[]): void {
  const current = parseVisits(rawVisits());
  const next = mergeDays(current, days);
  if (next.length === current.length && next.every((d, i) => d === current[i])) return;
  write(VISITS_KEY, JSON.stringify({ version: 1, days: next }));
}

export const visitSentOn = (): string | null => read(VISIT_SENT_KEY);
export const markVisitSent = (today: string): void => write(VISIT_SENT_KEY, today);
