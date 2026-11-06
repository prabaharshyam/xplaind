"use client";

import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { useActivity, useGame, usePractice, useProgress } from "@/lib/browser/hooks";


/** Streak and counts, from this device. Works without an account. */
export function ProgressOverview() {
  const game = useGame();
  const progress = useProgress();
  const practice = usePractice();
  const activity = useActivity();
  const done = Object.values(progress.stops).filter((s) => s.status === "done").length;
  const started = Object.values(progress.stops).filter((s) => s.status === "in_progress").length;

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Streak" className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.03] dark:border-zinc-800 dark:bg-zinc-900">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <Icon name="fire" size={28} />
        </span>
        <div>
          <p className="text-3xl font-semibold">
            {game.streak} {game.streak === 1 ? "day" : "days"}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">in a row. Learn something today to keep your streak.</p>
        </div>
      </section>

      <section aria-labelledby="counts-h">
        <h2 id="counts-h" className="sr-only">
          Your numbers
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Lessons done", done],
            ["In progress", started],
            ["Questions practiced", Object.keys(practice.ratings).length],
            ["Mock interviews", activity.interviews.length],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <dt className="text-sm text-zinc-600 dark:text-zinc-400">{k}</dt>
              <dd className="mt-1 text-2xl font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </section>


      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Saved in this browser. Clearing your browser data clears it.{" "}
        <Link href="/paths" className="font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300">
          Continue learning
        </Link>
      </p>
    </div>
  );
}
