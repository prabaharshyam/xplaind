"use client";
// React hooks over browser storage. The server and the first client render see
// nothing stored, so pages prerender cleanly and fill in after hydration.
import { useMemo, useSyncExternalStore } from "react";
import { todayInIST } from "@/lib/dates";
import { scoreAnswers } from "@/lib/placement/score";
import { parseAttempt, rawAttempt } from "./attempt-store";
import { parseProgress, rawProgress } from "./progress-store";
import { serverSnapshot, subscribe } from "./storage";

/** The saved test and its placement, or null when there is none (or before hydration). */
export function useAttempt() {
  const raw = useSyncExternalStore(subscribe, rawAttempt, serverSnapshot);
  return useMemo(() => {
    const attempt = parseAttempt(raw);
    return { raw, attempt, result: attempt ? scoreAnswers(attempt.answers) : null };
  }, [raw]);
}

export function useProgress() {
  const raw = useSyncExternalStore(subscribe, rawProgress, serverSnapshot);
  return useMemo(() => parseProgress(raw), [raw]);
}

const noSubscription = () => () => {};

/** Today in India, or undefined while prerendering (the build does not know today). */
export function useToday(): string | undefined {
  return useSyncExternalStore(noSubscription, todayInIST, () => undefined);
}
