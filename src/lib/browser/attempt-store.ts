// Browser-only storage for the placement test (PL-5). A signed-out learner's result
// stays on their device; nothing here talks to a server. Every read and write is
// wrapped, because storage can be blocked, full or empty (private windows, etc.).
import type { Answer, TestState } from "@/lib/placement/types";

export const TEST_KEY = "xplaind.test.v1"; // a test in progress
export const ATTEMPT_KEY = "xplaind.attempt.v1"; // the last finished test
const CHANGE_EVENT = "xplaind:storage";

export type TestInProgress = { goal: string; weeklyHours: number; state: TestState };
export type SavedAttempt = {
  version: 1;
  goal: string;
  weeklyHours: number;
  /** YYYY-MM-DD in India. */
  completedOn: string;
  answers: Answer[];
};

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the learner can still finish the test in this tab.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** For useSyncExternalStore. */
export function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export const rawTest = (): string | null => read(TEST_KEY);
export const rawAttempt = (): string | null => read(ATTEMPT_KEY);
export const serverSnapshot = (): string | null => null;

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
