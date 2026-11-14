"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useActivity, useGame, useInterviewDate, usePractice, useProgress, useSavedPlan, useToday } from "@/lib/browser/hooks";
import { activeDays } from "@/lib/game/xp";
import { weekOf } from "@/lib/plan/weekly";
import { nudges } from "@/lib/nudges";
import { primaryButtonSm } from "@/components/ui";

/** NG-1: up to two short nudges from this device's progress, at the top of the dashboard. */
export function NudgeBar({ path, lessons, hasTest }: { path: { id: string; name: string }; lessons: { id: string; title: string }[]; hasTest: boolean }) {
  const today = useToday();
  const progress = useProgress();
  const practice = usePractice();
  const activity = useActivity();
  const { streak } = useGame();
  const interviewOn = useInterviewDate();
  const plan = useSavedPlan();

  const list = useMemo(() => {
    if (!today) return [];
    const open = lessons.filter((l) => progress.stops[l.id]?.status !== "done");
    const week = plan && plan.week === weekOf(today).start && plan.pathId === path.id ? { total: plan.lessonIds.length, done: plan.lessonIds.filter((id) => progress.stops[id]?.status === "done").length } : null;
    return nudges({
      today,
      activeDays: activeDays({ stops: progress.stops, ratings: practice.ratings, interviews: activity.interviews }),
      streak,
      hasTest,
      interviewOn,
      path,
      nextLesson: open.find((l) => progress.stops[l.id]?.status === "in_progress") ?? open[0] ?? null,
      openLessons: open.length,
      week,
    });
  }, [today, lessons, progress.stops, practice.ratings, activity.interviews, streak, hasTest, interviewOn, path, plan]);

  if (!list.length) return null;
  return (
    <section aria-label="Suggested next steps" className="flex flex-col gap-3">
      {list.map((n) => (
        <div key={n.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
          <p className="min-w-0 flex-1 leading-7">{n.text}</p>
          <Link href={n.href} className={primaryButtonSm}>
            {n.cta}
          </Link>
        </div>
      ))}
    </section>
  );
}
