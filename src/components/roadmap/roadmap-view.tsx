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
import { DownloadChecklist } from "./download-checklist";

// One roadmap design for every path (RM-1). A spine runs down the page; each section
// is a station on it with its topics on either side. Every topic shows the learner's
// state (to do, learning, done, skipped) and can be marked without leaving the map.
// Phones get the spine on the left and one column of topics.

/** Literal class names per section, so Tailwind keeps them. Text on chip colours passes AA. */
/** MO-5: pastel milestones on the spine, one colour per stage, dark text for contrast. */
const SECTION_COLOURS = [
  { chip: "bg-violet-200 text-violet-950 ring-1 ring-violet-400", node: "bg-violet-100 ring-violet-400 dark:bg-violet-950 dark:ring-violet-700", badge: "bg-violet-700" },
  { chip: "bg-sky-200 text-sky-950 ring-1 ring-sky-400", node: "bg-sky-100 ring-sky-400 dark:bg-sky-950 dark:ring-sky-700", badge: "bg-sky-700" },
  { chip: "bg-emerald-200 text-emerald-950 ring-1 ring-emerald-400", node: "bg-emerald-100 ring-emerald-400 dark:bg-emerald-950 dark:ring-emerald-700", badge: "bg-emerald-700" },
  { chip: "bg-orange-200 text-orange-950 ring-1 ring-orange-400", node: "bg-orange-100 ring-orange-400 dark:bg-orange-950 dark:ring-orange-700", badge: "bg-orange-700" },
  { chip: "bg-pink-200 text-pink-950 ring-1 ring-pink-400", node: "bg-pink-100 ring-pink-400 dark:bg-pink-950 dark:ring-pink-700", badge: "bg-pink-700" },
  { chip: "bg-teal-200 text-teal-950 ring-1 ring-teal-400", node: "bg-teal-100 ring-teal-400 dark:bg-teal-950 dark:ring-teal-700", badge: "bg-teal-700" },
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
      <DownloadChecklist model={model} />
      <ProgressSummary counts={counts} filter={filter} onFilter={setFilter} />

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
                      className={`flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 ${SECTION_COLOURS[i % SECTION_COLOURS.length].chip}`}
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
          <ol className="relative flex flex-col gap-12">
            <span aria-hidden="true" className="absolute top-2 bottom-2 left-4 w-0 -translate-x-1/2 border-l-2 border-dashed border-violet-300 md:left-1/2 dark:border-violet-800" />
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
  // Like a hand-drawn roadmap: topics branch off the milestone in two clusters, left and right.
  const half = Math.ceil(shown.length / 2);
  const clusters = [shown.slice(0, half), shown.slice(half)].filter((c) => c.length > 0);
  const tile = (t: RoadmapTopic) => (
    <li key={t.key}>
      <TopicCard topic={t} state={t.stopId ? topicStateOf(progress, t.stopId) : null} below={start !== null && t.level !== null && levelIndex(t.level) < levelIndex(start)} />
    </li>
  );

  return (
    <li id={sectionAnchor(section.id)} aria-labelledby={headingId} className="relative scroll-mt-20">
      <div className="grid gap-4 pl-12 md:grid-cols-[minmax(0,1fr)_minmax(13rem,16rem)_minmax(0,1fr)] md:items-center md:gap-0 md:pl-0">
        {/* the milestone on the spine */}
        <div className="relative md:col-start-2 md:row-start-1 md:px-6">
          <span aria-hidden="true" className={`absolute top-3 -left-12 z-10 grid size-8 place-items-center rounded-full text-xs font-bold text-white ring-4 ring-white md:hidden dark:ring-zinc-950 ${colour.badge}`}>
            {section.code}
          </span>
          <div className={`relative z-10 rounded-2xl px-4 py-3 text-center shadow-sm ring-2 ${colour.node}`}>
            <p className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <span aria-hidden="true" className={`hidden size-6 place-items-center rounded-full text-[11px] font-bold text-white md:grid ${colour.badge}`}>
                {section.code}
              </span>
              {finished} of {written.length} finished
            </p>
            <h2 id={headingId} className="mt-1 text-base leading-6 font-semibold text-balance text-zinc-950 dark:text-white">
              {section.href ? (
                <Link href={section.href} className="hover:underline">
                  {section.title}
                </Link>
              ) : (
                section.title
              )}
            </h2>
            {start && section.code === start && (
              <p className="mt-1.5">
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-950 dark:bg-amber-900 dark:text-amber-50">You start here</span>
              </p>
            )}
          </div>
          <p className={`mt-2 text-center text-xs leading-5 ${muted}`}>{section.summary}</p>
        </div>

        {shown.length === 0 ? (
          <p className={`text-sm md:col-span-3 md:text-center ${muted}`}>Nothing to show here with the current filter.</p>
        ) : (
          clusters.map((c, ci) => (
            <div key={ci} className={`relative md:row-start-1 ${ci === 0 ? "md:col-start-1 md:pr-10" : "md:col-start-3 md:pl-10"}`}>
              {/* dotted branch from the cluster to the milestone */}
              <span
                aria-hidden="true"
                className={`absolute top-1/2 hidden w-10 border-t-2 border-dotted border-violet-300 md:block dark:border-violet-800 ${ci === 0 ? "right-0" : "left-0"}`}
              />
              <ul className="grid grid-cols-1 gap-2 rounded-2xl bg-white/60 p-2 ring-1 ring-violet-100 backdrop-blur sm:grid-cols-2 md:grid-cols-1 dark:bg-white/[0.03] dark:ring-violet-950">
                {c.map(tile)}
              </ul>
            </div>
          ))
        )}
      </div>

      {section.project && (
        <div className="mt-4 pl-12 md:mx-auto md:max-w-sm md:pl-0">
          <button
            type="button"
            onClick={onProject}
            className="relative z-10 flex w-full items-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3 text-left hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:hover:bg-amber-950"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-400 text-amber-950">
              <Icon name="trophy" size={18} />
            </span>
            <span className="text-sm">
              <span className="block text-xs font-semibold text-amber-900 dark:text-amber-200">{/^\d+$/.test(section.code) ? "Stage project" : "Level project"}</span>
              <span className="font-medium">{section.project.title}</span>
            </span>
          </button>
        </div>
      )}
    </li>
  );
}

/** A topic tile: the title, clearly readable, and a small button to mark it. Details open in the drawer. */
function TopicCard({ topic, state, below }: { topic: RoadmapTopic; state: TopicState | null; below: boolean }) {
  const [marking, setMarking] = useState(false);
  if (!topic.stopId || !state) {
    return (
      <div className="flex h-full min-h-12 flex-col justify-center rounded-xl border-2 border-dashed border-zinc-300 px-3 py-2 dark:border-zinc-700" title={topic.summary}>
        <span className="text-sm leading-5 font-medium text-zinc-700 dark:text-zinc-300">{topic.title}</span>
        <span className={`text-[11px] font-medium ${muted}`}>Coming soon{topic.optional ? " · optional" : ""}</span>
      </div>
    );
  }
  const style = STATE_STYLE[state];
  return (
    <div className={`h-full rounded-xl border-2 transition hover:-translate-y-px hover:shadow-md ${style.card} ${below && state === "todo" ? "opacity-80" : ""}`}>
      <div className="flex min-h-12 items-center gap-2 py-1.5 pr-1.5 pl-3">
        <TopicLink
          id={topic.stopId}
          label={`${topic.title}, ${style.label}`}
          className={`flex-1 text-sm leading-5 font-semibold text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100 ${state === "skipped" ? "text-zinc-600 line-through dark:text-zinc-400" : ""}`}
        >
          {topic.title}
          {topic.optional && <span className={`ml-1.5 text-[10px] font-medium uppercase ${muted}`}>Optional</span>}
        </TopicLink>
        <button
          type="button"
          aria-expanded={marking}
          aria-label={`${marking ? "Close" : "Mark"} ${topic.title}`}
          title={`${style.label}${topic.hours !== null ? ` · about ${topic.hours} h` : ""}${below ? " · below your level" : ""}`}
          onClick={() => setMarking((m) => !m)}
          className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-violet-700 dark:hover:bg-white/10"
        >
          {marking ? (
            <Icon name="close" size={14} />
          ) : state === "done" ? (
            <span className="grid size-5 place-items-center rounded-full bg-emerald-600 text-white">
              <Icon name="tick" size={12} />
            </span>
          ) : (
            <span className={`size-5 rounded-full border-2 ${style.dot}`} />
          )}
        </button>
      </div>
      {marking && (
        <div className="border-t border-zinc-200 px-2 py-2 dark:border-zinc-800">
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
