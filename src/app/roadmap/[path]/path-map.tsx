"use client";

import Link from "next/link";
import { NextStepsCard } from "@/components/next-steps-card";
import { muted, primaryButton, secondaryButton } from "@/components/ui";
import { useAttempt, useCurrentPathId, useProgress } from "@/lib/browser/hooks";
import { setPath } from "@/lib/browser/progress-store";
import { type LevelId, levelIndex } from "@/lib/levels";
import { type LessonSummary, type PathView, type StageView, startFor, testHref } from "@/lib/paths";
import { coverage, statusOf } from "@/lib/roadmap/progress";
import type { ProgressMap, StopStatus } from "@/lib/roadmap/types";
import { Icon } from "@/components/art/icons";
import { useTopicLink } from "@/components/roadmap/topic-drawer";
import { themeOf } from "@/lib/themes";

// A path laid out in stages, drawn as one metro line: each stage a station, each
// lesson a stop, topics still being written as hollow stops, and the stage project
// at the end. One rail on the left, at every width.

/** Literal class names, so Tailwind keeps them. Text on chip colours passes AA. */
const COLOURS = [
  { rail: "bg-emerald-600", chip: "bg-emerald-700 text-white", ring: "border-emerald-600", dot: "bg-emerald-600" },
  { rail: "bg-sky-600", chip: "bg-sky-700 text-white", ring: "border-sky-600", dot: "bg-sky-600" },
  { rail: "bg-violet-600", chip: "bg-violet-700 text-white", ring: "border-violet-600", dot: "bg-violet-600" },
  { rail: "bg-amber-600", chip: "bg-amber-700 text-white", ring: "border-amber-600", dot: "bg-amber-600" },
  { rail: "bg-rose-600", chip: "bg-rose-700 text-white", ring: "border-rose-600", dot: "bg-rose-600" },
  { rail: "bg-teal-600", chip: "bg-teal-700 text-white", ring: "border-teal-600", dot: "bg-teal-600" },
] as const;

const stageAnchor = (id: string) => `stage-${id}`;

export function PathMap({ path, known }: { path: PathView; known: string[] }) {
  const progress = useProgress();
  const { result } = useAttempt();
  const current = useCurrentPathId(known);
  const lessons = path.stages.flatMap((st) => st.lessons);
  const tested = path.placement === "ladder" ? (result?.startLevel ?? null) : null;
  const start = startFor(path, tested);
  const cov = coverage(lessons, start, progress.stops);
  const mine = current === path.id && progress.path === path.id;

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="status-heading" className="flex flex-col gap-3 rounded-xl bg-zinc-100 p-4 dark:bg-zinc-900">
        <h2 id="status-heading" className="font-semibold">
          {mine ? "This is your path" : "Make this your path"}
        </h2>
        <p className="leading-7">
          {cov.percent}% covered: {cov.doneHours} of {cov.totalHours} hours of written lessons
          {tested ? ` from ${tested} up` : ""}. Lessons you finish on any path count here too.
        </p>
        <div
          className="h-2 overflow-hidden rounded-full bg-zinc-300 dark:bg-zinc-700"
          role="progressbar"
          aria-label="Path covered"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={cov.percent}
        >
          <div className="h-full bg-emerald-700" style={{ width: `${cov.percent}%` }} />
        </div>
        <div className="flex flex-wrap gap-3">
          {!mine && (
            <button type="button" className={primaryButton} onClick={() => setPath(path.id)}>
              Make this my path
            </button>
          )}
          {path.placement === "ladder" && (
            <Link href={testHref(path.id)} className={mine ? primaryButton : secondaryButton}>
              {tested ? "Retake the level test" : "Find my level"}
            </Link>
          )}
        </div>
        {path.placement === "ladder" && !tested && (
          <p className={`text-sm ${muted}`}>The short test lets you skip lessons you already know.</p>
        )}
      </section>

      <NextStepsCard stops={lessons} startLevel={start} gapTags={tested ? (result?.gaps ?? []) : []} pathId={path.id} />

      <nav aria-label="Stages">
        <ol className="flex flex-wrap gap-2">
          {path.stages.map((st, i) => (
            <li key={st.id}>
              <a
                href={`#${stageAnchor(st.id)}`}
                className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${COLOURS[i % COLOURS.length].chip}`}
              >
                {i + 1}
                <span>{st.title}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <ol className="flex flex-col gap-10">
        {path.stages.map((st, i) => (
          <Stage key={st.id} stage={st} n={i + 1} colour={COLOURS[i % COLOURS.length]} progress={progress.stops} start={tested} />
        ))}
      </ol>
    </div>
  );
}

function Stage({
  stage,
  n,
  colour,
  progress,
  start,
}: {
  stage: StageView;
  n: number;
  colour: (typeof COLOURS)[number];
  progress: ProgressMap;
  start: LevelId | null;
}) {
  const headingId = `${stageAnchor(stage.id)}-heading`;
  const done = stage.lessons.filter((l) => statusOf(progress, l.id) === "done").length;
  return (
    <li id={stageAnchor(stage.id)} aria-labelledby={headingId} className="relative scroll-mt-20 pl-14">
      <span aria-hidden="true" className={`absolute top-6 bottom-0 left-5 w-1.5 -translate-x-1/2 rounded-full ${colour.rail}`} />
      <span
        aria-hidden="true"
        className={`absolute top-0 left-0 flex size-10 items-center justify-center rounded-full text-lg font-semibold ${colour.chip}`}
      >
        {n}
      </span>
      <p className={`text-sm ${muted}`}>
        Stage {n} · {done} of {stage.lessons.length} done
      </p>
      <h2 id={headingId} className="text-2xl font-semibold tracking-tight">
        {stage.title}
      </h2>
      <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">{stage.summary}</p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {stage.lessons.map((l) => (
          <li key={l.id}>
            <TopicNode lesson={l} status={statusOf(progress, l.id)} below={start !== null && levelIndex(l.level) < levelIndex(start)} />
          </li>
        ))}
        {stage.planned.map((t) => (
          <li key={t.title} className="flex flex-col rounded-xl border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
            <span className="font-medium">{t.title}</span>
            <span className={`text-sm ${muted}`}>Being written · {t.summary}</span>
          </li>
        ))}
      </ul>

      {stage.project && (
        <section aria-label={`Stage ${n} project`} className="mt-4 flex gap-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-400 text-amber-950">
            <Icon name="trophy" size={22} />
          </span>
          <div>
            <p className={`text-sm font-semibold ${muted}`}>Stage project</p>
            <h3 className="mt-0.5 text-lg font-semibold">{stage.project.title}</h3>
            <p className="mt-2 leading-7">{stage.project.brief}</p>
            <p className="mt-3 text-sm font-medium">What to show</p>
            <ul className="mt-1 list-disc pl-5 leading-7">
              {stage.project.deliverables.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </li>
  );
}

const STATUS_PILL = {
  done: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  in_progress: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  not_started: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
} as const;

/** One topic on the map: a link that opens the drawer, coloured by its theme. */
export function TopicNode({ lesson, status, below }: { lesson: LessonSummary; status: StopStatus; below: boolean }) {
  const link = useTopicLink(lesson.id);
  const t = themeOf(lesson.theme ?? "ai-basics");
  const label = status === "done" ? "Done" : status === "in_progress" ? "In progress" : below ? "Below your level: optional" : "Ready to start";
  return (
    <Link
      href={`/stop/${lesson.id}`}
      {...link}
      className={`group flex h-full min-h-16 items-center gap-3 rounded-xl border bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:bg-zinc-900 ${
        status === "done" ? "border-emerald-500" : "border-zinc-200 dark:border-zinc-800"
      } ${below && status !== "done" ? "opacity-80" : ""}`}
    >
      <span className="relative grid size-11 shrink-0 place-items-center rounded-lg text-white" style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}>
        <Icon name={t.icon} size={20} />
        {status === "done" && (
          <span aria-hidden="true" className="absolute -right-1.5 -bottom-1.5 grid size-5 place-items-center rounded-full bg-emerald-600 text-[11px] ring-2 ring-white dark:ring-zinc-900">
            ✓
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium leading-6 group-hover:underline">{lesson.title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2 py-0.5 font-medium ${STATUS_PILL[status]}`}>{label}</span>
          <span className={muted}>about {lesson.hours} {lesson.hours === 1 ? "hour" : "hours"}</span>
        </span>
      </span>
    </Link>
  );
}
