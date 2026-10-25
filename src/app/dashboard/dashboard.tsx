"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NextStepsCard } from "@/components/next-steps-card";
import { muted, secondaryButton, textLink } from "@/components/ui";
import { weeklyStreak } from "@/lib/account/streak";
import { claimDevice, type ClaimResult } from "@/lib/browser/claim";
import { useAttempt, useProgress, useToday } from "@/lib/browser/hooks";
import { type LevelId, levelIndex } from "@/lib/levels";
import { coverage } from "@/lib/roadmap/progress";
import type { RoadmapStop } from "@/lib/roadmap/types";

type Level = { id: LevelId; name: string; draft_hours: number };
type Stop = RoadmapStop & { title: string };

/** AC-3. Claims the device's data first (AC-2), so the dashboard and this device agree. */
export function Dashboard({ email, levels, stops }: { email: string | null; levels: Level[]; stops: Stop[] }) {
  const [claim, setClaim] = useState<ClaimResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { result } = useAttempt();
  const progress = useProgress();
  const today = useToday();

  useEffect(() => {
    claimDevice().then(setClaim, (e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <p role="alert" className="mt-6 leading-7">
        {error}{" "}
        <button type="button" className={textLink} onClick={() => location.reload()}>
          Try again
        </button>
      </p>
    );
  }
  if (!claim || !today) return <p className="mt-6">Loading your progress…</p>;

  const start = result?.startLevel ?? null;
  const streak = weeklyStreak(claim.activityDays, today);
  const byLevel = new Map(levels.map((l) => [l.id, l]));

  return (
    <div className="mt-6 flex flex-col gap-8">
      <p className={`text-sm ${muted}`}>Signed in as {email}</p>

      <section aria-labelledby="level-heading" className="rounded-xl bg-zinc-100 p-4 dark:bg-zinc-900">
        <h2 id="level-heading" className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Your level
        </h2>
        {start ? (
          <p className="mt-1 text-2xl font-semibold">
            {start} {byLevel.get(start)?.name}
          </p>
        ) : (
          <p className="mt-1">
            No test yet.{" "}
            <Link href="/start" className={textLink}>
              Find your level
            </Link>
          </p>
        )}
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className={muted}>Weekly streak</dt>
            <dd className="text-lg font-semibold">
              {streak.current} {streak.current === 1 ? "week" : "weeks"}
            </dd>
            <dd className={`text-xs ${muted}`}>{streak.activeThisWeek ? "This week counts already." : "Finish a step or practise this week to keep it."}</dd>
          </div>
          <div>
            <dt className={muted}>Weekly goal</dt>
            <dd className="text-lg font-semibold">{claim.weeklyHours ? `${claim.weeklyHours} hours` : "Not set"}</dd>
            <dd className="text-xs">
              <Link href="/settings" className={textLink}>
                Change
              </Link>
            </dd>
          </div>
        </dl>
      </section>

      {start && <NextStepsCard stops={stops} startLevel={start} gapTags={result?.gaps ?? []} />}

      <section aria-labelledby="levels-heading" className="flex flex-col gap-3">
        <h2 id="levels-heading" className="text-xl font-semibold">
          Progress across the nine levels
        </h2>
        <ul className="flex flex-col gap-2">
          {levels.map((l) => {
            const levelStops = stops.filter((s) => s.level === l.id);
            const cov = coverage(levelStops, l.id, progress.stops);
            const earned = claim.badges.includes(`level-${l.id}`);
            const below = start !== null && levelIndex(l.id) < levelIndex(start);
            return (
              <li key={l.id} className="flex items-center gap-3">
                <span className="w-8 text-sm font-semibold">{l.id}</span>
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
                  role="progressbar"
                  aria-label={`${l.id} ${l.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={cov.percent}
                >
                  <div className="h-full bg-emerald-700" style={{ width: `${cov.percent}%` }} />
                </div>
                <span className={`w-28 text-right text-xs ${muted}`}>
                  {earned ? "Badge earned" : below ? "Below your level" : `${cov.done} of ${cov.total} steps`}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="badges-heading" className="flex flex-col gap-2">
        <h2 id="badges-heading" className="text-xl font-semibold">
          Badges
        </h2>
        {claim.badges.length === 0 ? (
          <p className={muted}>Pass a level in the test, or finish every step of a level with its check or project, to earn its badge.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {claim.badges.map((b) => (
              <li key={b} className="rounded-full bg-emerald-700 px-3 py-1 text-sm font-medium text-white">
                {b.replace("level-", "")} passed
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/start" className={secondaryButton}>
          Take the test again
        </Link>
        <Link href="/settings" className={secondaryButton}>
          Settings and level card
        </Link>
      </div>
    </div>
  );
}
