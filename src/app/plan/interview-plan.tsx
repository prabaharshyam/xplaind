"use client";

import Link from "next/link";
import { useId, useMemo } from "react";
import { secondaryButton } from "@/components/ui";
import { useInterviewDate } from "@/lib/browser/hooks";
import { saveInterviewDate } from "@/lib/browser/plan-store";
import { interviewPlan, MAX_DAYS_AHEAD } from "@/lib/plan/interview";
import type { LessonState, PlanLesson } from "@/lib/plan/weekly";

const fmt = (iso: string) => new Date(`${iso}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const plus = (iso: string, n: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

/** PP-1: weeks from today to the interview, sized to the learner's hours, with the last week for practice. */
export function InterviewPlan({ today, pathId, pathName, lessons, hours, state }: { today: string; pathId: string; pathName: string; lessons: PlanLesson[]; hours: number; state: (id: string) => LessonState }) {
  const inputId = useId();
  const date = useInterviewDate();
  const plan = useMemo(() => (date ? interviewPlan(lessons, state, today, date, hours) : null), [date, lessons, state, today, hours]);
  const titles = useMemo(() => new Map(lessons.map((l) => [l.id, l.title])), [lessons]);

  return (
    <section aria-labelledby="interview-plan-heading" className="mt-10 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 id="interview-plan-heading" className="text-xl font-semibold">
        Got an interview coming up?
      </h2>
      <p className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300">Add the date and we plan every week until then, with the last week kept for mock interviews.</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label htmlFor={inputId} className="block text-sm font-medium">
          Interview date
          <input
            id={inputId}
            type="date"
            min={plus(today, 1)}
            max={plus(today, MAX_DAYS_AHEAD)}
            value={date ?? ""}
            onChange={(e) => saveInterviewDate(e.target.value || null)}
            className="mt-1 block min-h-11 rounded-2xl border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        {date && (
          <button type="button" className={secondaryButton} onClick={() => saveInterviewDate(null)}>
            Clear date
          </button>
        )}
      </div>

      {plan?.status === "past" && <p className="mt-4 text-sm">That date has passed. Pick a date from tomorrow on.</p>}
      {plan?.status === "too_far" && <p className="mt-4 text-sm">Pick a date within the next year.</p>}
      {plan?.status === "ok" && (
        <div className="mt-5">
          <p className="leading-7">
            <strong>{plan.daysLeft} days</strong> to your {pathName} interview at {hours} hours a week.{" "}
            {plan.leftOut === 0
              ? "That is enough time for every open lesson on your roadmap."
              : `${plan.leftOut} ${plan.leftOut === 1 ? "lesson does" : "lessons do"} not fit. To fit them all, study about ${plan.neededPerWeek} hours a week, or focus on the lessons below.`}
          </p>
          <ol className="mt-4 space-y-3">
            {plan.weeks.map((w, i) => (
              <li key={w.start} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="text-sm font-medium text-violet-800 dark:text-violet-300">
                  Week {i + 1} · {fmt(w.start)} to {fmt(w.end)}
                </p>
                {w.lessonIds.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {w.lessonIds.map((id) => (
                      <li key={id}>
                        <Link href={`/stop/${id}`} className="hover:underline">
                          {titles.get(id) ?? id}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {w.practice && (
                  <p className="mt-2 text-sm leading-6">
                    {w.lessonIds.length ? "Also: " : ""}
                    <Link href={`/interview/simulator?path=${pathId}`} className="font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300">
                      mock interviews
                    </Link>{" "}
                    and{" "}
                    <Link href="/interview" className="font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300">
                      interview questions for your role
                    </Link>
                    .
                  </p>
                )}
                {!w.lessonIds.length && !w.practice && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Catch up on anything you missed.</p>}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">Saved on this device. Lessons you finish drop out of the plan.</p>
        </div>
      )}
    </section>
  );
}
