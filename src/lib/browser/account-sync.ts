// When a learner is signed in, changes saved on the device are also sent to the
// server (AC-4, IQ-4). Signed out, nothing leaves the device. Sends are best
// effort: the device copy stays the source of truth until the next claim merges.
import type { RatingRecord } from "@/lib/practice/queue";
import type { StopProgress } from "@/lib/roadmap/types";

let signedIn = false;

export const setSignedIn = (value: boolean): void => {
  signedIn = value;
};
export const isSignedIn = (): boolean => signedIn;

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
