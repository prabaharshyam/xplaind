"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/art/icons";
import { NextStepsCard } from "@/components/next-steps-card";
import { useTopicLink } from "@/components/roadmap/topic-drawer";
import { STATE_STYLE, TopicStatus } from "@/components/roadmap/topic-status";
import { muted, primaryButton, secondaryButton, textLink } from "@/components/ui";
import { useAttempt, useCurrentPathId, useProgress, useToday } from "@/lib/browser/hooks";
import { type ProjectProgress, setPath, setProject } from "@/lib/browser/progress-store";
import { read, serverSnapshot, subscribe, write } from "@/lib/browser/storage";
import { todayInIST } from "@/lib/dates";
import { type LevelId, levelIndex } from "@/lib/levels";
import { type LessonSummary, startFor, testHref } from "@/lib/paths";
import { type StateCounts, type TopicState, coverage, isProjectUrl, stateCounts, topicStateOf } from "@/lib/roadmap/progress";
import type { ProgressMap } from "@/lib/roadmap/types";
import { type RoadmapModel, type RoadmapSection, type RoadmapTopic, projectKey, roadmapStopIds } from "@/lib/roadmap/view";
import { themeOf } from "@/lib/themes";
import { DownloadChecklist } from "./download-checklist";

// One roadmap design for every path (RM-1). A spine runs down the page; each section
// is a station on it with its topics on either side. Every topic shows the learner's
// state (to do, learning, done, skipped) and can be marked without leaving the map.
// Phones get the spine on the left and one column of topics.

/** Literal class names per section, so Tailwind keeps them. Text on chip colours passes AA. */
const SECTION_COLOURS = [
  { chip: "bg-emerald-700 text-white", rail: "bg-emerald-600" },
  { chip: "bg-sky-700 text-white", rail: "bg-sky-600" },
  { chip: "bg-violet-700 text-white", rail: "bg-violet-600" },
  { chip: "bg-amber-700 text-white", rail: "bg-amber-600" },
  { chip: "bg-rose-700 text-white", rail: "bg-rose-600" },
  { chip: "bg-teal-700 text-white", rail: "bg-teal-600" },
] as const;

type Filter = "all" | TopicState;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "todo", label: "To do" },
  { id: "learning", label: "Learning" },
  { id: "done", label: "Done" },
  { id: "skipped", label: "Skipped" },
];

const PREFS_KEY = "xplaind.roadmap.prefs.v1";
const sectionAnchor = (id: string) => `section-${id}`;

/** "Hide finished" is remembered on this device, for every roadmap. */
function useHideFinished(): [boolean, (v: boolean) => void] {
  const raw = useSyncExternalStore(subscribe, () => read(PREFS_KEY), serverSnapshot);
  let hide = false;
  try {
    hide = raw ? (JSON.parse(raw) as { hideFinished?: unknown }).hideFinished === true : false;
  } catch {
    hide = false;
  }
  return [hide, (v) => write(PREFS_KEY, JSON.stringify({ hideFinished: v }))];
}

/** Which tab is open, kept in the address so it can be shared: #projects. */
function useTab(): ["roadmap" | "projects", (t: "roadmap" | "projects") => void] {
  const hash = useSyncExternalStore(
    (cb) => {
      window.addEventListener("hashchange", cb);
      return () => window.removeEventListener("hashchange", cb);
    },
    () => window.location.hash,
    () => "",
  );
  const tab = hash === "#projects" ? "projects" : "roadmap";
  return [
    tab,
    (t) => {
      const url = `${window.location.pathname}${window.location.search}${t === "projects" ? "#projects" : ""}`;
      window.history.replaceState(null, "", url);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    },
  ];
}

export function RoadmapView({ model, lessons, known }: { model: RoadmapModel; lessons: LessonSummary[]; known: string[] }) {
  const progress = useProgress();
  const { result } = useAttempt();
  const current = useCurrentPathId(known);
  const [tab, setTab] = useTab();
  const [filter, setFilter] = useState<Filter>("all");
  const [hideFinished, setHideFinished] = useHideFinished();

  const ids = roadmapStopIds(model);
  const counts = stateCounts(ids, progress.stops);
  const tested = model.placement === "ladder" ? (result?.startLevel ?? null) : null;
  const start = startFor(model, tested);
  const cov = coverage(lessons, start, progress.stops);
  const mine = current === model.pathId && progress.path === model.pathId;
  const projects = model.sections.filter((s) => s.project);

  const visible = (t: RoadmapTopic): boolean => {
    const state = t.stopId ? topicStateOf(progress.stops, t.stopId) : null;
    if (filter !== "all") return state === filter;
    if (hideFinished) return state !== "done" && state !== "skipped";
    return true;
  };

  return (
    <div className="flex flex-col gap-6">
      <ProgressSummary counts={counts} filter={filter} onFilter={setFilter} />
      <DownloadChecklist model={model} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
      <section aria-labelledby="path-status" className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 id="path-status" className="font-semibold">
          {mine ? "This is your path" : "Make this your path"}
        </h2>
        {tested && (
          <p className="text-sm leading-6">
            You start at <span className="font-semibold">{tested}</span>: {cov.percent}% covered, {cov.doneHours} of {cov.totalHours} hours from {tested} up.
          </p>
        )}
        <p className={`text-sm ${muted}`}>Lessons you finish on any path count here too.</p>
        <div className="flex flex-wrap gap-3">
          {!mine && (
            <button type="button" className={primaryButton} onClick={() => setPath(model.pathId)}>
              Make this my path
            </button>
          )}
          {model.placement === "ladder" && (
            <Link href={testHref(model.pathId)} className={mine ? primaryButton : secondaryButton}>
              {tested ? "Retake the level test" : "Find my level"}
            </Link>
          )}
        </div>
      </section>

      <div className="min-w-0">
        <NextStepsCard stops={lessons} startLevel={start} gapTags={tested ? (result?.gaps ?? []) : []} pathId={model.pathId} />
      </div>
      </div>

      <div id="roadmap-tabs" role="tablist" aria-label="Roadmap views" className="flex scroll-mt-20 gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {(
          [
            ["roadmap", "Roadmap", "map"],
            ["projects", `Projects (${projects.length})`, "trophy"],
          ] as const
        ).map(([id, label, icon]) => (
          <button
            key={id}
            id={`tab-${id}`}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={`-mb-px flex min-h-11 items-center gap-2 border-b-2 px-4 font-medium ${
              tab === id ? "border-emerald-700 text-zinc-900 dark:text-white" : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <Icon name={icon} size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === "roadmap" ? (
        <div id="panel-roadmap" role="tabpanel" aria-labelledby="tab-roadmap" className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav aria-label="Sections">
              <ol className="flex flex-wrap gap-1.5">
                {model.sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${sectionAnchor(s.id)}`}
                      className={`flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${SECTION_COLOURS[i % SECTION_COLOURS.length].chip}`}
                    >
                      {s.code}
                      <span className="sr-only"> {s.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
              <input type="checkbox" className="size-5 accent-emerald-700" checked={hideFinished} onChange={(e) => setHideFinished(e.target.checked)} />
              Hide done and skipped
            </label>
          </div>
          <Legend />
          <ol className="relative flex flex-col gap-10">
            <span aria-hidden="true" className="absolute top-2 bottom-2 left-5 w-1 -translate-x-1/2 rounded-full bg-zinc-200 md:left-1/2 dark:bg-zinc-800" />
            {model.sections.map((s, i) => (
              <Section key={s.id} section={s} index={i} progress={progress.stops} start={tested} visible={visible} onProject={() => {
                  setTab("projects");
                  document.getElementById("roadmap-tabs")?.scrollIntoView({ block: "start" });
                }} />
            ))}
          </ol>
        </div>
      ) : (
        <div id="panel-projects" role="tabpanel" aria-labelledby="tab-projects">
          <ProjectsTab pathId={model.pathId} sections={projects} progress={progress.stops} saved={progress.projects ?? {}} />
        </div>
      )}
    </div>
  );
}

/** The headline: percent finished, a segmented bar, and counts that double as filters. */
function ProgressSummary({ counts, filter, onFilter }: { counts: StateCounts; filter: Filter; onFilter: (f: Filter) => void }) {
  const seg = (n: number) => `${counts.total ? (n / counts.total) * 100 : 0}%`;
  return (
    <section aria-labelledby="progress-h" className="rounded-2xl bg-zinc-100 p-4 md:p-5 dark:bg-zinc-900">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="progress-h" className="font-semibold">
          Your progress
        </h2>
        <p className="text-sm">
          <span className="text-2xl font-semibold">{counts.percent}%</span> <span className={muted}>finished</span>
        </p>
      </div>
      <div
        className="mt-3 flex h-3 overflow-hidden rounded-full bg-white dark:bg-zinc-800"
        role="progressbar"
        aria-label="Roadmap finished"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={counts.percent}
      >
        <span className="bg-emerald-600" style={{ width: seg(counts.done) }} />
        <span className="bg-zinc-400" style={{ width: seg(counts.skipped) }} />
        <span className="bg-amber-400" style={{ width: seg(counts.learning) }} />
      </div>
      <div role="group" aria-label="Show topics" className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const n = f.id === "all" ? counts.total : counts[f.id];
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={active}
              onClick={() => onFilter(f.id)}
              className={`flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-medium ${
                active ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900" : "border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              }`}
            >
              {f.id !== "all" && <span aria-hidden="true" className={`size-3 rounded-full border-2 ${STATE_STYLE[f.id].dot}`} />}
              {f.label} <span className="tabular-nums">{n}</span>
            </button>
          );
        })}
      </div>
      <p className={`mt-2 text-xs ${muted}`}>Mark each topic as Learning, Done or Skip to track how much of the roadmap you have covered. Saved on this device, and to your account when you sign in.</p>
    </section>
  );
}

function Legend() {
  return (
    <ul aria-label="Map key" className={`flex flex-wrap gap-x-5 gap-y-2 text-sm ${muted}`}>
      {(["todo", "learning", "done", "skipped"] as const).map((s) => (
        <li key={s} className="flex items-center gap-2">
          <span aria-hidden="true" className={`size-4 rounded-full border-2 ${STATE_STYLE[s].dot}`} />
          {STATE_STYLE[s].label}
        </li>
      ))}
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="size-4 rounded-full border-2 border-dashed border-zinc-400" />
        Coming soon
      </li>
    </ul>
  );
}

function Section({
  section,
  index,
  progress,
  start,
  visible,
  onProject,
}: {
  section: RoadmapSection;
  index: number;
  progress: ProgressMap;
  start: LevelId | null;
  visible: (t: RoadmapTopic) => boolean;
  onProject: () => void;
}) {
  const colour = SECTION_COLOURS[index % SECTION_COLOURS.length];
  const written = section.topics.filter((t) => t.stopId);
  const finished = written.filter((t) => {
    const s = topicStateOf(progress, t.stopId!);
    return s === "done" || s === "skipped";
  }).length;
  const shown = section.topics.filter(visible);
  const headingId = `${sectionAnchor(section.id)}-h`;

  return (
    <li id={sectionAnchor(section.id)} aria-labelledby={headingId} className="relative scroll-mt-20">
      {/* the station on the spine */}
      <div className="relative flex flex-col gap-2 pl-14 md:items-center md:pl-0 md:text-center">
        <span aria-hidden="true" className={`absolute top-0 left-0 z-10 flex size-10 items-center justify-center rounded-full text-sm font-bold md:static ${colour.chip}`}>
          {section.code}
        </span>
        <h2 id={headingId} className="text-xl font-semibold tracking-tight text-balance md:text-2xl">
          {section.href ? (
            <Link href={section.href} className="hover:underline">
              {section.title}
            </Link>
          ) : (
            section.title
          )}
        </h2>
        <p className="max-w-2xl leading-7 text-zinc-700 dark:text-zinc-300">{section.summary}</p>
        <p className={`text-sm ${muted}`}>
          {start && section.code === start && (
            <span className="mr-2 rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-950 dark:bg-amber-900 dark:text-amber-50">You start here</span>
          )}
          {finished} of {written.length} finished
        </p>
      </div>

      {shown.length > 0 ? (
        <ul className="mt-5 grid gap-3 pl-14 md:grid-cols-2 md:gap-x-16 md:pl-0">
          {shown.map((t, i) => (
            <li key={t.key} className="lx-rise relative">
              {/* connector to the spine */}
              <span
                aria-hidden="true"
                className={`absolute top-7 h-0 w-9 border-t-2 border-dotted border-zinc-300 dark:border-zinc-700 ${i % 2 === 0 ? "-left-9 md:left-auto md:-right-8 md:w-8" : "-left-9 md:-left-8 md:w-8"}`}
              />
              <TopicCard topic={t} state={t.stopId ? topicStateOf(progress, t.stopId) : null} below={start !== null && t.level !== null && levelIndex(t.level) < levelIndex(start)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className={`mt-4 pl-14 text-sm md:pl-0 md:text-center ${muted}`}>Nothing to show here with the current filter.</p>
      )}

      {section.project && (
        <div className="mt-4 pl-14 md:mx-auto md:max-w-xl md:pl-0">
          <button
            type="button"
            onClick={onProject}
            className="flex w-full items-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3 text-left hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-950"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-400 text-amber-950">
              <Icon name="trophy" size={20} />
            </span>
            <span>
              <span className="block text-xs font-semibold text-amber-900 dark:text-amber-200">{/^\d+$/.test(section.code) ? "Stage project" : "Level project"}</span>
              <span className="font-medium">{section.project.title}</span>
            </span>
          </button>
        </div>
      )}
    </li>
  );
}

function TopicCard({ topic, state, below }: { topic: RoadmapTopic; state: TopicState | null; below: boolean }) {
  const [marking, setMarking] = useState(false);
  if (!topic.stopId || !state) {
    return (
      <div className="flex h-full flex-col rounded-xl border-2 border-dashed border-zinc-300 p-3 dark:border-zinc-700">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-medium">{topic.title}</span>
          {topic.optional && <span className={`text-xs font-medium uppercase ${muted}`}>Optional</span>}
        </span>
        <span className={`mt-1 text-sm leading-6 ${muted}`}>{topic.summary}</span>
        <span className={`mt-2 text-xs font-medium ${muted}`}>Coming soon</span>
      </div>
    );
  }
  const style = STATE_STYLE[state];
  const t = themeOf(topic.theme ?? "ai-basics");
  return (
    <div className={`flex h-full flex-col rounded-xl border-2 p-3 transition ${style.card} ${below && state === "todo" ? "opacity-80" : ""}`}>
      <div className="flex items-start gap-3">
        <span className="relative grid size-10 shrink-0 place-items-center rounded-lg text-white" style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}>
          <Icon name={t.icon} size={18} />
          <span aria-hidden="true" className={`absolute -right-1 -bottom-1 size-4 rounded-full border-2 ring-2 ring-white dark:ring-zinc-900 ${style.dot}`} />
        </span>
        <div className="min-w-0 flex-1">
          <TopicLink id={topic.stopId} label={`${topic.title}, ${style.label}`} className={`font-medium leading-6 underline-offset-2 hover:underline ${state === "skipped" ? "text-zinc-600 line-through dark:text-zinc-400" : ""}`}>
            {topic.title}
          </TopicLink>
          <p className={`mt-0.5 line-clamp-2 text-sm leading-6 ${muted}`}>{topic.summary}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={muted}>
          <span className="font-medium text-zinc-800 dark:text-zinc-200">{style.label}</span>
          {topic.hours !== null && ` · about ${topic.hours} ${topic.hours === 1 ? "hour" : "hours"}`}
          {below && " · below your level"}
        </span>
        <button
          type="button"
          aria-expanded={marking}
          onClick={() => setMarking((m) => !m)}
          className="min-h-9 rounded-full border border-zinc-300 bg-white px-3 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          {marking ? "Close" : "Mark"}
          <span className="sr-only"> {topic.title}</span>
        </button>
      </div>
      {marking && (
        <div className="mt-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
          <TopicStatus stopId={topic.stopId} title={topic.title} size="sm" />
        </div>
      )}
    </div>
  );
}

/** A topic's link: a plain click opens the drawer; it stays a real link for no-JS and new tabs. */
function TopicLink({ id, className, label, children }: { id: string; className: string; label?: string; children: React.ReactNode }) {
  const link = useTopicLink(id);
  return (
    <Link href={`/stop/${id}`} {...link} aria-label={label} className={className}>
      {children}
    </Link>
  );
}

const PROJECT_STATE: Record<"todo" | ProjectProgress["status"], string> = { todo: "Not started", building: "Building", done: "Done" };

function ProjectsTab({
  pathId,
  sections,
  progress,
  saved,
}: {
  pathId: string;
  sections: RoadmapSection[];
  progress: ProgressMap;
  saved: Record<string, ProjectProgress>;
}) {
  const done = sections.filter((s) => saved[projectKey(pathId, s.id, s.project?.guide)]?.status === "done").length;
  if (sections.length === 0) return <p className={muted}>This roadmap has no projects yet.</p>;
  return (
    <div className="flex flex-col gap-4">
      <p className="leading-7">
        Each stage ends in a project that proves you can use what it teaches. Build them in order: a project is ready once you have finished most of its stage.{" "}
        <span className="font-medium">
          {done} of {sections.length} projects done.
        </span>
      </p>
      <ol className="flex flex-col gap-4">
        {sections.map((s, i) => (
          <ProjectCard key={s.id} n={i + 1} pathId={pathId} section={s} progress={progress} record={saved[projectKey(pathId, s.id, s.project?.guide)]} />
        ))}
      </ol>
    </div>
  );
}

function ProjectCard({
  n,
  pathId,
  section,
  progress,
  record,
}: {
  n: number;
  pathId: string;
  section: RoadmapSection;
  progress: ProgressMap;
  record: ProjectProgress | undefined;
}) {
  const today = useToday();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const project = section.project!;
  const key = projectKey(pathId, section.id, project.guide);
  const ids = section.topics.flatMap((t) => (t.stopId ? [t.stopId] : []));
  const c = stateCounts(ids, progress);
  const ready = c.percent >= 70;
  const state = record?.status ?? "todo";
  const day = () => today ?? todayInIST();
  const headingId = `project-${section.id}`;

  return (
    <li aria-labelledby={headingId} className="lx-rise flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 md:p-5 dark:border-zinc-800">
      <div className="flex items-start gap-3">
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${state === "done" ? "bg-emerald-600 text-white" : "bg-amber-400 text-amber-950"}`}>
          <Icon name={state === "done" ? "tick" : "trophy"} size={22} />
        </span>
        <div className="min-w-0">
          <p className={`text-sm ${muted}`}>
            Project {n} · {section.title} · {PROJECT_STATE[state]}
          </p>
          <h3 id={headingId} className="text-lg font-semibold">
            {project.title}
          </h3>
        </div>
      </div>
      <p className="leading-7">{project.brief}</p>
      {project.guide && (
        <Link href={`/projects/${project.guide}`} className={`w-fit gap-2 ${primaryButton}`}>
          <Icon name="map" size={18} /> Open the step-by-step guide
          {record?.steps?.length ? <span className="sr-only"> ({record.steps.length} steps ticked)</span> : null}
        </Link>
      )}
      {project.deliverables.length > 0 && (
        <div>
          <p className="text-sm font-medium">What to show</p>
          <ul className="mt-1 list-disc pl-5 leading-7">
            {project.deliverables.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <p className="text-sm">
          <span className="font-medium">{ready ? "Ready to build." : "Finish more of this stage first."}</span>{" "}
          <span className={muted}>
            {c.done + c.skipped} of {c.total} lessons finished.
          </span>
        </p>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800" aria-hidden="true">
          <div className="h-full bg-emerald-600" style={{ width: `${c.percent}%` }} />
        </div>
      </div>
      {record?.url && (
        <p className="text-sm">
          Your project:{" "}
          <a href={record.url} target="_blank" rel="noopener noreferrer" className={textLink}>
            {record.url}
          </a>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {state !== "building" && state !== "done" && (
          <button type="button" className={secondaryButton} onClick={() => setProject(key, { ...record, status: "building", updatedOn: day() })}>
            I am building this
          </button>
        )}
        {state !== "todo" && (
          <button type="button" className="min-h-10 px-2 text-sm underline underline-offset-2" onClick={() => setProject(key, null)}>
            Reset
          </button>
        )}
      </div>
      {state !== "done" && (
        <form
          noValidate
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isProjectUrl(url)) {
              setError("Paste a full web link, such as https://github.com/you/project.");
              return;
            }
            setError(null);
            setProject(key, { ...record, status: "done", url: url.trim(), updatedOn: day() });
          }}
        >
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
            Link to your project
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${headingId}-error` : undefined}
              className="min-h-11 rounded-lg border border-zinc-300 bg-white px-3 font-normal dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="https://github.com/you/project"
            />
          </label>
          <button type="submit" className={primaryButton}>
            Mark project done
          </button>
        </form>
      )}
      {error && (
        <p id={`${headingId}-error`} role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </li>
  );
}
