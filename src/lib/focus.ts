// FC-1 (2026-11-27, owner: "a minimalistic Pomodoro timer like StudyFetch has, so that the user can read with focus
// and track"): focus blocks and breaks. Pure: no browser, no React. Times are milliseconds since the epoch; days are
// India dates (YYYY-MM-DD) passed in by the caller.
export const PRESETS = [
  { id: "25", focus: 25, rest: 5, label: "25 min focus, 5 min break" },
  { id: "50", focus: 50, rest: 10, label: "50 min focus, 10 min break" },
] as const;
export type PresetId = (typeof PRESETS)[number]["id"];
export const presetOf = (id: string) => PRESETS.find((p) => p.id === id) ?? PRESETS[0];

export type Phase = "focus" | "rest";
/** Running: endsAt is set. Paused or idle: left holds what remains. */
export type FocusState = { preset: PresetId; phase: Phase; endsAt: number | null; left: number };
/** Focus finished per day: sessions and minutes. */
export type FocusLog = Record<string, { sessions: number; minutes: number }>;

const MIN = 60_000;
export const lengthOf = (preset: PresetId, phase: Phase) => (phase === "focus" ? presetOf(preset).focus : presetOf(preset).rest) * MIN;
export const idle = (preset: PresetId = "25"): FocusState => ({ preset, phase: "focus", endsAt: null, left: lengthOf(preset, "focus") });

export const remaining = (s: FocusState, now: number) => (s.endsAt === null ? s.left : Math.max(0, s.endsAt - now));
export const running = (s: FocusState) => s.endsAt !== null;

export const start = (s: FocusState, now: number): FocusState => (running(s) ? s : { ...s, endsAt: now + s.left });
export const pause = (s: FocusState, now: number): FocusState => (running(s) ? { ...s, endsAt: null, left: remaining(s, now) } : s);
export const reset = (s: FocusState): FocusState => idle(s.preset);
export const choose = (preset: PresetId): FocusState => idle(preset);

/**
 * Moves to the next phase. A focus block that ran to its end is logged for the day; skipping one is not. The next
 * phase waits for Start, so nothing begins while the learner is away.
 */
export function next(s: FocusState, log: FocusLog, day: string, finished: boolean): { state: FocusState; log: FocusLog } {
  const phase: Phase = s.phase === "focus" ? "rest" : "focus";
  const state: FocusState = { preset: s.preset, phase, endsAt: null, left: lengthOf(s.preset, phase) };
  if (s.phase !== "focus" || !finished) return { state, log };
  const today = log[day] ?? { sessions: 0, minutes: 0 };
  return { state, log: { ...log, [day]: { sessions: today.sessions + 1, minutes: today.minutes + presetOf(s.preset).focus } } };
}

/** "24:59", for the timer and the top bar. */
export const clock = (ms: number) => {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

/** The last n days up to today (YYYY-MM-DD, oldest first) with the minutes focused on each. */
export function lastDays(log: FocusLog, today: string, n = 7) {
  const [y, m, d] = today.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const day = new Date(Date.UTC(y, m - 1, d - (n - 1 - i))).toISOString().slice(0, 10);
    return { day, minutes: log[day]?.minutes ?? 0 };
  });
}
