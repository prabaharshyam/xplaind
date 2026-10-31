"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Icon } from "@/components/art/icons";
import { useProgress } from "@/lib/browser/hooks";
import { setLastStop } from "@/lib/browser/progress-store";
import { useAccountState } from "./account-link";

/** AC-6: notes the lesson being read, so the learner can carry on from it later. */
export function LessonVisit({ stopId }: { stopId: string }) {
  useEffect(() => setLastStop(stopId), [stopId]);
  return null;
}

/**
 * AC-6: "Continue where you left off", for a learner who has opened a lesson before.
 * Signed out, it also asks them to sign up so their place follows them to any device.
 */
export function ContinueCard({ titles }: { titles: Record<string, string> }) {
  const progress = useProgress();
  const account = useAccountState();
  const last = progress.last && titles[progress.last.stopId] ? progress.last : null;
  if (!last) return null;
  return (
    <section aria-labelledby="continue-h" className="rounded-3xl bg-gradient-to-br from-sky-100 via-violet-100 to-pink-100 p-5 ring-1 ring-violet-200 md:p-6 dark:from-sky-950 dark:via-violet-950 dark:to-pink-950 dark:ring-violet-900">
      <h2 id="continue-h" className="text-sm font-semibold tracking-wide text-violet-800 uppercase dark:text-violet-300">
        Continue where you left off
      </h2>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xl font-semibold text-zinc-900 dark:text-white">{titles[last.stopId]}</p>
        <Link
          href={`/stop/${last.stopId}`}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-violet-700 px-6 font-semibold text-white shadow-md hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
        >
          <Icon name="play" size={16} /> Resume lesson
        </Link>
      </div>
      {account === "out" && (
        <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
          Your place is saved on this device.{" "}
          <Link href="/signin" className="font-semibold text-violet-800 underline underline-offset-2 dark:text-violet-300">
            Sign up
          </Link>{" "}
          to keep it on every device.
        </p>
      )}
    </section>
  );
}
