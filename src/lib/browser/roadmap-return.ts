// RM-16: which roadmap the learner is studying from, and where on it they were, kept for this visit
// (sessionStorage), so a lesson opened from a roadmap links back to that roadmap and its next topic,
// and "Back to the roadmap" lands where they left. Every access is wrapped: storage can be blocked.
const LAST = "xp:roadmap";
const SPOT = "xp:roadmap-spot";

function get(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function set(key: string, value: string | null): void {
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, value);
  } catch {
    // Storage blocked: the lesson falls back to its first roadmap and the map opens at the top.
  }
}

/** The roadmap the learner last opened in this visit. */
export const lastRoadmap = (): string | null => get(LAST);
export const rememberRoadmap = (pathId: string): void => set(LAST, pathId);

type Spot = { pathId: string; y: number; back?: boolean };
const readSpot = (): Spot | null => {
  try {
    return JSON.parse(get(SPOT) ?? "null") as Spot | null;
  } catch {
    return null;
  }
};

/** A topic on the map was opened: keep the map's scroll position. */
export function saveSpot(pathId: string, y: number): void {
  set(SPOT, JSON.stringify({ pathId, y }));
}

/** "Back to the roadmap" was tapped: the map should open where the learner left it. */
export function markReturn(pathId: string): void {
  const s = readSpot();
  if (s?.pathId === pathId) set(SPOT, JSON.stringify({ ...s, back: true }));
}

/** On the map: the position to restore, once, if the learner came back to it. */
export function takeReturn(pathId: string): number | null {
  const s = readSpot();
  if (!s?.back || s.pathId !== pathId) return null;
  set(SPOT, JSON.stringify({ pathId, y: s.y }));
  return s.y;
}
