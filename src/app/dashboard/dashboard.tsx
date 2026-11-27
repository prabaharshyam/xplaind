"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NextStepsCard } from "@/components/next-steps-card";
import { muted, secondaryButton, textLink } from "@/components/ui";
import { weeklyStreak } from "@/lib/account/streak";
import { claimDevice, type ClaimResult } from "@/lib/browser/claim";
import { useAttempt, useCurrentPathId, useProgress, useToday } from "@/lib/browser/hooks";
import { type LevelId, levelIndex } from "@/lib/levels";
import { DEFAULT_PATH_ID, type PathRef, roadmapHref, startFor, testHref } from "@/lib/paths";
import { coverage } from "@/lib/roadmap/progress";
import type { RoadmapStop } from "@/lib/roadmap/types";
import { Skeleton } from "@/components/skeleton";
import { NudgeBar } from "./nudge-bar";
import { InterviewReadiness } from "./interview-readiness";
import { AppTabs } from "@/components/app-tabs";

type Level = { id: LevelId; name: string; draft_hours: number };
type Stop = RoadmapStop & { title: string };

/** AC-3. Claims the device's data first (AC-2), so the dashboard and this device agree. */
export function Dashboard({
  email,
  levels,
  paths,
  stopsByPath,
}: {
  email: string | null;
  levels: Level[];
  paths: PathRef[];
  stopsByPath: Record<string, Stop[]>;
}) {
  const [claim, setClaim] = useState<ClaimResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { result } = useAttempt();
  const progress = useProgress();
  const today = useToday();
  const pathId = useCurrentPathId(paths.map((p) => p.id));
  const path = paths.find((p) => p.id === pathId)!;
  const pathStops = stopsByPath[pathId] ?? [];
  // Level progress is measured on the nine-level GenAI ladder.
  const stops = stopsByPath[DEFAULT_PATH_ID] ?? [];

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
  if (!claim || !today) return <Skeleton label="Loading your progress…" className="mt-6" />;

  const start = result?.startLevel ?? null;
  const streak = weeklyStreak(claim.activityDays, today);
  const byLevel = new Map(levels.map((l) => [l.id, l]));

  const levelSection = (
    <section aria-labelledby="level-heading" className="flex flex-col gap-4">
      <div>
        <h2 id="level-heading" className={`text-sm font-medium ${muted}`}>
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
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className={muted}>Weekly streak</dt>
          <dd className="text-lg font-semibold">
            {streak.current} {streak.current === 1 ? "week" : "weeks"}
          </dd>
          <dd className={`text-xs ${muted}`}>{streak.activeThisWeek ? "This week counts already." : "Finish a step or practice this week to keep it."}</dd>
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
  );

  return (
    <AppTabs
      id="dash"
      label="Your dashboard"
      tabs={[
        {
          id: "next",
          label: "Next steps",
          content: (
            <>
              <NudgeBar path={{ id: path.id, name: path.name }} lessons={pathStops.map((s) => ({ id: s.id, title: s.title }))} hasTest={result !== null} />
              <section aria-labelledby="path-heading" className="flex flex-col gap-1">
                <h2 id="path-heading" className={`text-sm font-medium ${muted}`}>
                  Your path
                </h2>
                <p className="text-xl font-semibold">
                  <Link href={roadmapHref(path.id)} className={textLink}>
                    {path.name}
                  </Link>
                </p>
                <p className="text-sm">
                  {coverage(pathStops, startFor(path, start), progress.stops).percent}% covered ·{" "}
                  <Link href="/paths" className={textLink}>
                    Change path
                  </Link>{" "}
                  ·{" "}
                  <Link href="/plan" className={textLink}>
                    Plan my week
                  </Link>
                </p>
              </section>
              {(start || path.placement === "none") && (
                <NextStepsCard stops={pathStops} startLevel={startFor(path, start)} gapTags={path.placement === "ladder" ? (result?.gaps ?? []) : []} pathId={path.id} />
              )}
            </>
          ),
        },
        {
          id: "progress",
          label: "Progress",
          content: (
            <>
              {levelSection}
              <section aria-labelledby="levels-heading" className="flex flex-col gap-3">
                <h2 id="levels-heading" className="text-lg font-semibold">
                  Progress across the nine levels
                </h2>
                <ul className="flex flex-col gap-2">
                  {levels.map((l) => {
                    const levelStops = stops.filter((st) => st.level === l.id);
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
                        <span className={`w-28 text-right text-xs ${muted}`}>{earned ? "Level done" : below ? "Below your level" : `${cov.done} of ${cov.total} steps`}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
              <InterviewReadiness />
              <Link href={testHref(path.placement === "ladder" ? path.id : DEFAULT_PATH_ID)} className={`${secondaryButton} self-start`}>
                Take the test again
              </Link>
            </>
          ),
        },
        {
          id: "account",
          label: "Account",
          content: (
            <>
              <p className="leading-7">Signed in as {email}</p>
              <Link href="/settings" className={`${secondaryButton} self-start`}>
                Settings and level card
              </Link>
            </>
          ),
        },
      ]}
    />
  );
}
