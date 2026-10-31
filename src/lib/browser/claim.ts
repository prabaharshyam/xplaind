// AC-2: send the device's saved result, progress and ratings to /api/claim, then
// store the merged copy the server returns, so this device matches the account.
import type { Answer } from "@/lib/placement/types";
import type { RatingRecord } from "@/lib/practice/queue";
import type { StopProgress } from "@/lib/roadmap/types";
import { type SavedAttempt, parseAttempt, rawAttempt, saveAttempt } from "./attempt-store";
import { parsePractice, rawPractice, replaceRatings } from "./practice-store";
import { type LastStop, mergeLastStop, parseProgress, rawProgress, replaceStops } from "./progress-store";

export type ClaimResult = {
  progress: Record<string, StopProgress>;
  ratings: Record<string, RatingRecord>;
  attempt: (SavedAttempt & { answers: Answer[] }) | null;
  activityDays: string[];
  badges: string[];
  weeklyHours: number | null;
  lastStop?: LastStop | null;
};

export async function claimDevice(): Promise<ClaimResult> {
  const attempt = parseAttempt(rawAttempt());
  const body = {
    attempt:
      attempt && attempt.answers.length
        ? {
            goal: attempt.goal,
            weeklyHours: attempt.weeklyHours,
            completedOn: attempt.completedOn,
            choices: attempt.answers.map((a) => ({ questionId: a.questionId, choice: a.choice })),
          }
        : null,
    progress: parseProgress(rawProgress()).stops,
    ratings: parsePractice(rawPractice()).ratings,
  };
  const res = await fetch("/api/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    const message = ((await res.json().catch(() => null)) as { error?: string } | null)?.error;
    throw new Error(message ?? "Could not load your account.");
  }
  const result = (await res.json()) as ClaimResult;
  replaceStops(result.progress);
  replaceRatings(result.ratings);
  mergeLastStop(result.lastStop ?? null);
  // Keep the newest result on this device, so /result shows the same as the account.
  if (result.attempt && (!attempt || result.attempt.completedOn >= attempt.completedOn) && result.attempt.answers.length) {
    saveAttempt(result.attempt);
  }
  return result;
}
