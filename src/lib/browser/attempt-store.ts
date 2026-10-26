// Browser-only storage for the placement test (PL-5). A signed-out learner's result
// stays on their device; nothing here talks to a server.
import type { Answer, TestState } from "@/lib/placement/types";
import { read, write } from "./storage";

export { serverSnapshot, subscribe } from "./storage";

export const TEST_KEY = "xplaind.test.v1"; // a test in progress
export const ATTEMPT_KEY = "xplaind.attempt.v1"; // the last finished test

export type TestInProgress = { goal: string; weeklyHours: number; state: TestState };
export type SavedAttempt = {
  version: 1;
  goal: string;
  weeklyHours: number;
  /** YYYY-MM-DD in India. */
  completedOn: string;
  answers: Answer[];
};

export const rawTest = (): string | null => read(TEST_KEY);
export const rawAttempt = (): string | null => read(ATTEMPT_KEY);

export function parseTest(raw: string | null): TestInProgress | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as TestInProgress;
    return v && typeof v.goal === "string" && v.state && Array.isArray(v.state.answers) ? v : null;
  } catch {
    return null;
  }
}

export function parseAttempt(raw: string | null): SavedAttempt | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as SavedAttempt;
    return v && v.version === 1 && Array.isArray(v.answers) ? v : null;
  } catch {
    return null;
  }
}

export const saveTest = (t: TestInProgress): void => write(TEST_KEY, JSON.stringify(t));
export const clearTest = (): void => write(TEST_KEY, null);
export const saveAttempt = (a: SavedAttempt): void => write(ATTEMPT_KEY, JSON.stringify(a));
export const clearAttempt = (): void => write(ATTEMPT_KEY, null);
