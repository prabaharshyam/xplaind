// When a learner is signed in, changes saved on the device are also sent to the
// server (AC-4, IQ-4). Signed out, nothing leaves the device. Sends are best
// effort: the device copy stays the source of truth until the next claim merges.
import type { RatingRecord } from "@/lib/practice/queue";
import type { StopProgress } from "@/lib/roadmap/types";

let signedIn = false;
let known = false;

export const setSignedIn = (value: boolean): void => {
  signedIn = value;
  known = true;
};
export const isSignedIn = (): boolean => signedIn;

/** Accounts are on when the Supabase settings are built in. Off (local, CI), everything stays open. */
export const accountsOn = (): boolean => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** SU-1: what needs an account. Shown on the sign-up prompt. */
export type SignUpReason = "pdf" | "interview" | "progress" | "practice";
export const SIGNUP_EVENT = "xp:signup";

/** SU-2: may this device save progress? Always, while accounts are off; otherwise only when signed in. */
export const canSave = (): boolean => !accountsOn() || signedIn;

/**
 * SU-2: gate an action that needs an account. Returns true when it may go ahead; otherwise opens
 * the sign-up prompt (unless `quiet`, for saves the learner did not ask for) and returns false.
 */
export function needAccount(reason: SignUpReason, quiet = false): boolean {
  if (canSave()) return true;
  if (!quiet && known && typeof window !== "undefined") window.dispatchEvent(new CustomEvent(SIGNUP_EVENT, { detail: { reason } }));
  return false;
}

function send(path: string, body: unknown): void {
  if (!signedIn) return;
  void fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true }).catch(
    () => {
      // Offline or signed out elsewhere: the next claim on the dashboard catches up.
    },
  );
}

export const syncStop = (stopId: string, record: StopProgress | null): void => send("/api/progress", { stopId, record });
export const syncRating = (questionId: string, record: RatingRecord): void => send("/api/practice", { questionId, record });
export const syncPath = (pathId: string): void => send("/api/profile", { goalId: pathId });
export const syncLastStop = (stopId: string): void => send("/api/profile", { lastStopId: stopId });
