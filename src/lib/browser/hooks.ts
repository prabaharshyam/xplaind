"use client";
// React hooks over browser storage. The server and the first client render see
// nothing stored, so pages prerender cleanly and fill in after hydration.
import { useMemo, useSyncExternalStore } from "react";
import { todayInIST } from "@/lib/dates";
import { currentPathId } from "@/lib/paths";
import { scoreAnswers } from "@/lib/placement/score";
import { badgesOf, activeDays, rankOf, streakOf, xpOf } from "@/lib/game/xp";
import { parseActivity, rawActivity } from "./activity-store";
import { parseAi, rawAi } from "./ai-store";
import { parseAttempt, rawAttempt } from "./attempt-store";
import { parsePractice, rawPractice } from "./practice-store";
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

export function usePractice() {
  const raw = useSyncExternalStore(subscribe, rawPractice, serverSnapshot);
  return useMemo(() => parsePractice(raw), [raw]);
}

const noSubscription = () => () => {};

/** Today in India, or undefined while prerendering (the build does not know today). */
export function useToday(): string | undefined {
  return useSyncExternalStore(noSubscription, todayInIST, () => undefined);
}

/** The learner's current path id, from this device's choice or last test. Default before hydration. */
export function useCurrentPathId(known: readonly string[]): string {
  const progress = useProgress();
  const { attempt } = useAttempt();
  return currentPathId(known, progress.path, attempt?.goal);
}

/** Roadmaps and courses generated with AI on this device. */
export function useAi() {
  const raw = useSyncExternalStore(subscribe, rawAi, serverSnapshot);
  return useMemo(() => parseAi(raw), [raw]);
}

export function useActivity() {
  const raw = useSyncExternalStore(subscribe, rawActivity, serverSnapshot);
  return useMemo(() => parseActivity(raw), [raw]);
}

/** XP, rank, streak and badges from this device's activity. Zero before hydration. */
export function useGame() {
  const progress = useProgress();
  const practice = usePractice();
  const activity = useActivity();
  const today = useToday();
  return useMemo(() => {
    const inputs = { stops: progress.stops, ratings: practice.ratings, interviews: activity.interviews };
    const xp = xpOf(inputs);
    return {
      xp,
      rank: rankOf(xp),
      streak: today ? streakOf(activeDays(inputs), today) : 0,
      badges: today ? badgesOf(inputs, today) : [],
    };
  }, [progress.stops, practice.ratings, activity.interviews, today]);
}
