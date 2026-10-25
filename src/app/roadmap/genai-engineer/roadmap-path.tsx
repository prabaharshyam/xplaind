"use client";

import Link from "next/link";
import { muted, primaryButton, textLink } from "@/components/ui";
import { useAttempt, useProgress } from "@/lib/browser/hooks";
import { levelIndex } from "@/lib/levels";
import { coverage } from "@/lib/roadmap/progress";
import { type LevelSummary, type StopSummary, levelSlug } from "./shared";
import { StopList } from "./stop-list";

/** RM-1: the nine levels as a path, the start level marked, completed stops ticked. */
export function RoadmapPath({ levels, stops }: { levels: LevelSummary[]; stops: StopSummary[] }) {
  const { result } = useAttempt();
  const progress = useProgress();
  const start = result?.startLevel ?? null;
  const cov = start ? coverage(stops, start, progress.stops) : null;

  return (
    <div className="flex flex-col gap-8">
      {start && cov ? (
        <section aria-labelledby="progress-heading" className="flex flex-col gap-2 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900">
          <h2 id="progress-heading" className="font-semibold">
            You start at {start}
          </h2>
          <p className="leading-7">
            {cov.percent}% covered: {cov.doneHours} of {cov.totalHours} hours of written steps from {start} up.
            {cov.skipped > 0 && ` ${cov.skipped} of the done steps you skipped as already known.`}
          </p>
          <div
            className="h-2 overflow-hidden rounded-full bg-zinc-300 dark:bg-zinc-700"
            role="progressbar"
            aria-label="Roadmap covered"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={cov.percent}
          >
            <div className="h-full bg-emerald-700" style={{ width: `${cov.percent}%` }} />
          </div>
          <Link href="/result" className={`text-sm ${textLink}`}>
            Your next five steps
          </Link>
        </section>
      ) : (
        <section className="flex flex-col gap-3 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900">
          <p className="leading-7">Take the short test to find where you start, so you can skip what you already know.</p>
          <Link href="/start" className={primaryButton}>
            Find my level
          </Link>
        </section>
      )}

      <ol className="flex flex-col">
        {levels.map((l, i) => {
          const isStart = l.id === start;
          const below = start !== null && levelIndex(l.id) < levelIndex(start);
          const levelStops = stops.filter((s) => s.level === l.id);
          return (
            <li key={l.id} className="relative flex gap-4 pb-8 last:pb-0">
              {i < levels.length - 1 && (
                <span aria-hidden="true" className="absolute top-10 bottom-0 left-5 w-0.5 -translate-x-1/2 bg-zinc-300 dark:bg-zinc-700" />
              )}
              <span
                aria-hidden="true"
                className={`relative flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                  isStart
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : below
                      ? "border-zinc-300 text-zinc-500 dark:border-zinc-700"
                      : "border-zinc-400 bg-white dark:border-zinc-600 dark:bg-zinc-950"
                }`}
              >
                {l.id}
              </span>
              <section className="flex min-w-0 flex-1 flex-col gap-2" aria-labelledby={`level-${l.id}`}>
                <h2 id={`level-${l.id}`} className="pt-1.5 text-lg font-semibold">
                  <Link href={`/roadmap/genai-engineer/${levelSlug(l.id)}`} className="hover:underline">
                    {l.id} {l.name}
                  </Link>
                  {isStart && (
                    <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 align-middle text-sm font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                      You start here
                    </span>
                  )}
                </h2>
                <p className={`text-sm leading-6 ${muted}`}>
                  {below ? "Before your level. Use these steps to review. " : ""}
                  About {l.draft_hours} hours. {l.can_do}.
                </p>
                <StopList stops={levelStops} />
              </section>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
