"use client";

import { useGame, usePractice, useProgress } from "@/lib/browser/hooks";

/** DB-1: the three numbers that matter today, from this device. Works without an account. */
export function ProgressOverview() {
  const game = useGame();
  const progress = useProgress();
  const practice = usePractice();
  const done = Object.values(progress.stops).filter((s) => s.status === "done").length;
  const tile = "rounded-2xl bg-zinc-100 px-3 py-3 dark:bg-zinc-800/70";
  const label = "text-xs text-zinc-600 dark:text-zinc-400";
  const value = "mt-0.5 text-lg font-semibold tabular-nums md:text-xl";

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        <section aria-label="Streak" className={tile}>
          <p className={label}>Streak</p>
          <p className={value}>
            {game.streak} {game.streak === 1 ? "day" : "days"}
          </p>
        </section>
        <div className={tile}>
          <p className={label}>Lessons done</p>
          <p className={value}>{done}</p>
        </div>
        <div className={tile}>
          <p className={label}>Questions practised</p>
          <p className={value}>{Object.keys(practice.ratings).length}</p>
        </div>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Learn something today to keep your streak. Saved in this browser; clearing your browser data clears it.</p>
    </div>
  );
}
