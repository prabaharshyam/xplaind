// Browser-only record of finished mock interviews, for XP and streaks. Holds dates,
// counts and scores only: never the answers.
import type { InterviewSession } from "@/lib/game/xp";
import { read, write } from "./storage";

export const ACTIVITY_KEY = "xplaind.activity.v1";
const MAX_SESSIONS = 100;

export type SavedActivity = { version: 1; interviews: InterviewSession[] };
const EMPTY: SavedActivity = { version: 1, interviews: [] };

export const rawActivity = (): string | null => read(ACTIVITY_KEY);

const isSession = (s: unknown): s is InterviewSession => {
  const v = s as InterviewSession;
  return (
    !!v &&
    typeof v.on === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v.on) &&
    [v.answered, v.total, v.averageScore].every((n) => typeof n === "number" && n >= 0 && n <= 100)
  );
};

export function parseActivity(raw: string | null): SavedActivity {
  if (!raw) return EMPTY;
  try {
    const v = JSON.parse(raw) as SavedActivity;
    if (!v || v.version !== 1 || !Array.isArray(v.interviews)) return EMPTY;
    return { version: 1, interviews: v.interviews.filter(isSession).slice(-MAX_SESSIONS) };
  } catch {
    return EMPTY;
  }
}

export function recordInterview(session: InterviewSession): void {
  const current = parseActivity(rawActivity());
  write(ACTIVITY_KEY, JSON.stringify({ version: 1, interviews: [...current.interviews, session].slice(-MAX_SESSIONS) }));
}
