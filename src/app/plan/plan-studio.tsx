"use client";

import Link from "next/link";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { Icon } from "@/components/art/icons";
import { primaryButton, secondaryButton } from "@/components/ui";
import { useCurrentPathId, useProgress, useToday } from "@/lib/browser/hooks";
import { parsePlan, rawPlan, savePlan } from "@/lib/browser/plan-store";
import { setPath } from "@/lib/browser/progress-store";
import { serverSnapshot, subscribe } from "@/lib/browser/storage";
import { currentPlan, googleCalendarLink, HOUR_CHOICES, nextMonday, type PlanLesson, planWeek, reminderIcs, weekOf } from "@/lib/plan/weekly";
import { Skeleton } from "@/components/skeleton";
import { CommitCard } from "./commit-card";

const DEFAULT_HOURS = 6;
const fmt = (iso: string) => new Date(`${iso}T00:00:00+05:30`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

/** WP-1 to WP-3 and CM-90, together as "Stay on track" (FOCUS-2): this week's lessons for the chosen role, sized to the learner's hours, with a weekly reminder. */
export function PlanStudio({ paths, lessons, planUrl }: { paths: { id: string; name: string }[]; lessons: Record<string, PlanLesson[]>; planUrl: string }) {
  const today = useToday();
  const progress = useProgress();
  const pathId = useCurrentPathId(paths.map((p) => p.id));
  const saved = parsePlan(useSyncExternalStore(subscribe, rawPlan, serverSnapshot));
  const hours = saved?.hours ?? DEFAULT_HOURS;
  const week = today ? weekOf(today) : null;
  const byId = useMemo(() => new Map(Object.values(lessons).flat().map((l) => [l.id, l])), [lessons]);

  const plan = useMemo(() => {
    if (!week) return null;
    const state = (id: string) => {
      const s = progress.stops[id]?.status;
      return s === "done" || s === "in_progress" ? s : undefined;
    };
    return currentPlan(saved, week.start, pathId, hours, () => planWeek(lessons[pathId] ?? [], state, hours).items.map((l) => l.id));
  }, [week, saved, pathId, hours, lessons, progress.stops]);

  // Keep this week's plan fixed once made, so finishing a lesson ticks it instead of swapping it.
  useEffect(() => {
    if (plan && plan !== saved) savePlan(plan);
  }, [plan, saved]);

  if (!week || !plan) return <Skeleton label="Making your plan…" rows={4} />;

  const items = plan.lessonIds.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  const done = items.filter((l) => progress.stops[l.id]?.status === "done").length;
  const total = items.reduce((n, l) => n + l.hours, 0);
  const remindFrom = nextMonday(today!);

  const downloadIcs = () => {
    const url = URL.createObjectURL(new Blob([reminderIcs(remindFrom, planUrl)], { type: "text/calendar" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "xplaind-weekly-plan.ics" });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-labelledby="week-heading" className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-violet-800 dark:text-violet-300">
              {fmt(week.start)} – {fmt(week.end)}
            </p>
            <h2 id="week-heading" className="mt-1 text-2xl font-semibold">
              Your week
            </h2>
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {done} of {items.length} lessons done · about {total} h + 30 min practice
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800" aria-hidden="true">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-emerald-500 transition-[width]" style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }} />
        </div>

        <ol className="mt-6 space-y-3">
          {items.map((l, i) => {
            const isDone = progress.stops[l.id]?.status === "done";
            const started = progress.stops[l.id]?.status === "in_progress";
            return (
              <li key={l.id} className={`flex items-center gap-4 rounded-2xl border p-4 ${isDone ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"}`}>
                <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${isDone ? "bg-emerald-600 text-white" : "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200"}`}>
                  {isDone ? <Icon name="tick" size={16} label="Done" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/stop/${l.id}`} className={`font-medium hover:underline ${isDone ? "text-zinc-600 line-through dark:text-zinc-400" : ""}`}>
                    {l.title}
                  </Link>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    about {l.hours} {l.hours === 1 ? "hour" : "hours"}
                    {started && !isDone ? " · started" : ""}
                  </p>
                </div>
              </li>
            );
          })}
          <li className="flex items-center gap-4 rounded-2xl border border-dashed border-violet-300 p-4 dark:border-violet-800">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              <Icon name="check" size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <Link href="/practice" className="font-medium hover:underline">
                Practice interview flashcards
              </Link>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">30 minutes, any day this week</p>
            </div>
          </li>
        </ol>
        {items.length === 0 && <p className="mt-4 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">You have finished every lesson on this roadmap. Pick another role to keep going.</p>}
        {items.length > 0 && done === items.length && (
          <p className="mt-4 rounded-2xl bg-emerald-50 p-4 font-medium text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100">Week done. Next week&apos;s plan appears on Monday.</p>
        )}
      </section>

      <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-semibold">Your settings</h2>
          <label className="mt-3 block text-sm font-medium" htmlFor="plan-path">
            Role
          </label>
          <select id="plan-path" value={pathId} onChange={(e) => setPath(e.target.value)} className="mt-1 min-h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950">
            {paths.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <label className="mt-3 block text-sm font-medium" htmlFor="plan-hours">
            Hours a week
          </label>
          <select
            id="plan-hours"
            value={hours}
            onChange={(e) => savePlan({ week: week.start, pathId, hours: Number(e.target.value), lessonIds: [] })}
            className="mt-1 min-h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
          >
            {HOUR_CHOICES.map((h) => (
              <option key={h} value={h}>
                {h} hours
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">Changing these makes a new plan for this week. Saved on this device.</p>
        </div>

        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
          <h2 className="font-semibold">Calendar reminder</h2>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">A reminder every Monday at 9 am that opens this plan. No account needed.</p>
          <div className="mt-3 flex flex-col gap-2">
            <a href={googleCalendarLink(remindFrom, planUrl)} target="_blank" rel="noopener noreferrer" className={primaryButton}>
              Add to Google Calendar
            </a>
            <button type="button" onClick={downloadIcs} className={secondaryButton}>
              Add to iPhone or Outlook (.ics)
            </button>
          </div>
        </div>

        <CommitCard paths={paths} defaultPath={pathId} />
      </aside>
    </div>
  );
}
