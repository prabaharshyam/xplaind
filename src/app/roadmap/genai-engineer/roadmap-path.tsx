"use client";

import Link from "next/link";
import { muted, primaryButton, textLink } from "@/components/ui";
import { useAttempt, useProgress } from "@/lib/browser/hooks";
import { type LevelId, levelIndex } from "@/lib/levels";
import { type MapTopic, type Stage, stageOf } from "@/lib/roadmap/map";
import { coverage, statusOf } from "@/lib/roadmap/progress";
import type { ProgressMap, StopStatus } from "@/lib/roadmap/types";
import { type LevelSummary, type StopSummary, levelSlug } from "./shared";

// RM-1 as a metro map. Three coloured lines (Beginner, Intermediate, Pro), each
// level a station, each topic a stop on the line, optional topics on a dashed
// branch. Phones get one rail on the left; wider screens put the rail in the
// middle and alternate topics left and right.

/** Literal class names per line, so Tailwind keeps them. */
const LINE: Record<Stage, { name: string; rail: string; dot: string; ring: string; chip: string; soft: string }> = {
  beginner: {
    name: "Beginner line",
    rail: "bg-emerald-600",
    dot: "bg-emerald-600 border-emerald-600",
    ring: "border-emerald-600",
    chip: "bg-emerald-700 text-white",
    soft: "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  },
  intermediate: {
    name: "Intermediate line",
    rail: "bg-sky-600",
    dot: "bg-sky-600 border-sky-600",
    ring: "border-sky-600",
    chip: "bg-sky-700 text-white",
    soft: "bg-sky-50 text-sky-900 dark:bg-sky-950 dark:text-sky-100",
  },
  pro: {
    name: "Pro line",
    rail: "bg-violet-600",
    dot: "bg-violet-600 border-violet-600",
    ring: "border-violet-600",
    chip: "bg-violet-700 text-white",
    soft: "bg-violet-50 text-violet-900 dark:bg-violet-950 dark:text-violet-100",
  },
};

type TopicState = StopStatus | "coming_soon";
const STATE_TEXT: Record<TopicState, string> = {
  done: "Done",
  in_progress: "In progress",
  not_started: "Ready to start",
  coming_soon: "Coming soon",
};

const topicState = (t: MapTopic, progress: ProgressMap): TopicState => (t.stopId ? statusOf(progress, t.stopId) : "coming_soon");

/** Two columns on phones (rail, card); three on wide screens (card, rail, card). */
const ROW = "relative grid grid-cols-[2.5rem_1fr] gap-x-3 md:grid-cols-[1fr_3.5rem_1fr] md:gap-x-0";
const RAIL_CELL = "col-start-1 row-start-1 flex justify-center md:col-start-2";

export function RoadmapPath({ levels, stops }: { levels: LevelSummary[]; stops: StopSummary[] }) {
  const { result } = useAttempt();
  const progress = useProgress();
  const start = result?.startLevel ?? null;
  const cov = start ? coverage(stops, start, progress.stops) : null;
  const stages: Stage[] = ["beginner", "intermediate", "pro"];

  return (
    <div className="flex flex-col gap-8">
      {start && cov ? (
        <section aria-labelledby="progress-heading" className="flex flex-col gap-2 rounded-xl bg-zinc-100 p-4 dark:bg-zinc-900">
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
        <section className="flex flex-col gap-3 rounded-xl bg-zinc-100 p-4 dark:bg-zinc-900">
          <p className="leading-7">Take the short test to find your station, so you can skip what you already know.</p>
          <Link href="/start" className={primaryButton}>
            Find my level
          </Link>
        </section>
      )}

      <Overview levels={levels} start={start} />
      <Legend />

      {stages.map((stage) => {
        const line = LINE[stage];
        const stageLevels = levels.filter((l) => stageOf(l.id) === stage);
        return (
          <section key={stage} aria-label={line.name} className="relative">
            <p className={`mb-4 w-fit rounded-full px-3 py-1 text-sm font-semibold ${line.chip}`}>{line.name}</p>
            <div className="relative">
              <span aria-hidden="true" className={`absolute top-0 bottom-0 left-5 w-1.5 -translate-x-1/2 rounded-full md:left-1/2 ${line.rail}`} />
              <ol className="relative flex flex-col gap-6">
                {stageLevels.map((l) => (
                  <LevelStation key={l.id} level={l} stage={stage} start={start} progress={progress.stops} />
                ))}
              </ol>
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** All nine stations at a glance, as jump links. */
function Overview({ levels, start }: { levels: LevelSummary[]; start: LevelId | null }) {
  return (
    <nav aria-label="Levels">
      <ol className="flex flex-wrap items-center gap-1.5">
        {levels.map((l, i) => {
          const line = LINE[stageOf(l.id)];
          return (
            <li key={l.id} className="flex items-center gap-1.5">
              <a
                href={`#level-${levelSlug(l.id)}`}
                className={`flex size-11 items-center justify-center rounded-full text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
                  l.id === start ? `${line.chip} ring-4 ring-amber-400` : line.chip
                }`}
              >
                {l.id}
                <span className="sr-only">
                  {" "}
                  {l.name}
                  {l.id === start ? ", your start" : ""}
                </span>
              </a>
              {i < levels.length - 1 && <span aria-hidden="true" className="h-0.5 w-2 bg-zinc-300 dark:bg-zinc-700" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Legend() {
  const items: [string, string][] = [
    ["border-zinc-500 bg-zinc-500", "Done"],
    ["border-zinc-500 bg-white dark:bg-zinc-950", "Ready to start"],
    ["border-dashed border-zinc-400 bg-white dark:bg-zinc-950", "Coming soon"],
  ];
  return (
    <ul aria-label="Map key" className={`flex flex-wrap gap-x-5 gap-y-2 text-sm ${muted}`}>
      {items.map(([cls, label]) => (
        <li key={label} className="flex items-center gap-2">
          <span aria-hidden="true" className={`size-4 rounded-full border-2 ${cls}`} />
          {label}
        </li>
      ))}
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="h-0 w-6 border-t-2 border-dashed border-zinc-400" />
        Optional branch
      </li>
    </ul>
  );
}

function LevelStation({
  level,
  stage,
  start,
  progress,
}: {
  level: LevelSummary;
  stage: Stage;
  start: LevelId | null;
  progress: ProgressMap;
}) {
  const line = LINE[stage];
  const isStart = level.id === start;
  const below = start !== null && levelIndex(level.id) < levelIndex(start);
  const done = level.topics.filter((t) => topicState(t, progress) === "done").length;

  return (
    <li id={`level-${levelSlug(level.id)}`} className={`scroll-mt-6 ${below ? "opacity-75" : ""}`}>
      <section aria-labelledby={`station-${level.id}`} className="flex flex-col gap-3">
        {/* the station */}
        <div className={ROW}>
          <div className={RAIL_CELL}>
            <span
              aria-hidden="true"
              className={`relative z-10 flex size-12 items-center justify-center rounded-full border-4 bg-white text-sm font-bold dark:bg-zinc-950 ${line.ring} ${
                isStart ? "ring-4 ring-amber-400" : ""
              }`}
            >
              {level.id}
            </span>
          </div>
          <div className="col-start-2 row-start-1 md:col-start-3 md:pl-4">
            <h2 id={`station-${level.id}`} className="text-xl font-semibold text-balance">
              <Link href={`/roadmap/genai-engineer/${levelSlug(level.id)}`} className="hover:underline">
                {level.id} {level.name}
              </Link>
            </h2>
            <p className={`text-sm ${muted}`}>
              {isStart && <span className="mr-2 rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-950 dark:bg-amber-900 dark:text-amber-50">You start here</span>}
              {below && "Before your level: use it to review. "}
              About {level.draft_hours} hours · {done} of {level.topics.length} topics done
            </p>
          </div>
        </div>

        {/* its topics */}
        <ol className="flex flex-col gap-3">
          {level.topics.map((t, i) => (
            <TopicStop
              key={t.id}
              topic={t}
              line={line}
              state={topicState(t, progress)}
              side={i % 2 === 0 ? "right" : "left"}
              tuck={i > 0}
            />
          ))}
        </ol>

        {/* the level project, where the level ends */}
        <div className={ROW}>
          <div className={RAIL_CELL}>
            <span aria-hidden="true" className={`relative z-10 mt-3 size-4 rotate-45 ${line.dot}`} />
          </div>
          <p className={`col-start-2 row-start-1 rounded-lg px-3 py-2 text-sm leading-6 md:col-start-3 md:ml-4 ${line.soft}`}>
            <span className="font-semibold">Level project:</span> {level.exit_check}.
          </p>
        </div>
      </section>
    </li>
  );
}

function TopicStop({
  topic,
  line,
  state,
  side,
  tuck,
}: {
  topic: MapTopic;
  line: (typeof LINE)[Stage];
  state: TopicState;
  side: "left" | "right";
  /** On wide screens, overlap the previous card on the other side so the map stays compact. */
  tuck: boolean;
}) {
  const dot =
    state === "done"
      ? line.dot
      : state === "coming_soon"
        ? "border-dashed border-zinc-400 bg-white dark:border-zinc-500 dark:bg-zinc-950"
        : `bg-white dark:bg-zinc-950 ${line.ring}`;
  const card = `block rounded-lg border p-3 ${
    topic.optional ? "border-dashed" : ""
  } ${
    state === "coming_soon"
      ? "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50"
      : "border-zinc-300 bg-white hover:border-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-500"
  }`;
  const body = (
    <>
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-medium">{topic.title}</span>
        {topic.optional && <span className={`text-xs font-medium uppercase ${muted}`}>Optional</span>}
      </span>
      <span className={`mt-0.5 block text-sm leading-6 ${muted}`}>{topic.summary}</span>
      <span className={`mt-1 block text-xs font-medium ${state === "done" ? "text-emerald-800 dark:text-emerald-400" : muted}`}>
        {state === "done" ? "✓ " : ""}
        {STATE_TEXT[state]}
      </span>
    </>
  );

  const branch =
    side === "left"
      ? "left-1/2 w-[calc(50%+1.75rem)] md:right-1/2 md:left-auto md:w-[calc(50%+2.5rem)]"
      : "left-1/2 w-[calc(50%+1.75rem)] md:w-[calc(50%+2.5rem)]";
  const place =
    side === "left"
      ? `md:col-start-1 md:text-right ${topic.optional ? "ml-4 md:mr-10 md:ml-0" : "md:mr-4"}`
      : `md:col-start-3 ${topic.optional ? "ml-4 md:ml-10" : "md:ml-4"}`;

  return (
    <li className={`${ROW} ${tuck ? "md:-mt-14" : ""}`}>
      <div className={`${RAIL_CELL} relative`}>
        {topic.optional && (
          <span aria-hidden="true" className={`absolute top-6 h-0 border-t-2 border-dashed border-zinc-400 ${branch}`} />
        )}
        <span aria-hidden="true" className={`relative z-10 mt-3.5 size-5 rounded-full border-[3px] ${dot}`} />
      </div>
      <div className={`col-start-2 row-start-1 ${place}`}>
        {topic.stopId ? (
          <Link href={`/stop/${topic.stopId}`} className={card}>
            {body}
          </Link>
        ) : (
          <div className={card}>{body}</div>
        )}
      </div>
    </li>
  );
}
