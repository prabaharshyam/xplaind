"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/art/icons";
import { CourseThumb } from "@/components/course-thumb";
import { WatchButton } from "@/components/video-player";
import { secondaryButtonSm } from "@/components/ui";
import { levelWords } from "@/lib/levels";
import type { IconName } from "@/lib/themes";
import { ALL } from "@/lib/videos/browse";
import { ANDREW_NG, platformOf, type CourseFilter, type CourseLength, type CourseRow, type CourseSort, EMPTY_COURSE_FILTER, filterCourses, formatHours } from "@/lib/videos/courses";
import type { TopicChip } from "./video-browser";

const BANDS = [
  { id: ALL, label: "Any level" },
  { id: "B", label: "Beginner" },
  { id: "I", label: "Intermediate" },
  { id: "P", label: "Professional" },
];
const LENGTHS: { id: CourseLength; label: string }[] = [
  { id: ALL, label: "Any length" },
  { id: "short", label: "Under 2 hours" },
  { id: "medium", label: "2 to 10 hours" },
  { id: "long", label: "Over 10 hours" },
];
const SORTS: { id: CourseSort; label: string }[] = [
  { id: "newest", label: "Newest first" },
  { id: "short", label: "Shortest first" },
  { id: "long", label: "Longest first" },
  { id: "level", label: "Easiest first" },
];

const PAGE = 24;
const field =
  "min-h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700";
const chip = (on: boolean) =>
  `flex min-h-11 items-center gap-2 rounded-full border py-1.5 pr-3 pl-1.5 text-sm ${
    on ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black" : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
  }`;

/** VD-2: whole courses taught on video. YouTube lecture series play here; the rest open on the provider's site. */
export function CourseBrowser({ rows, topics }: { rows: CourseRow[]; topics: TopicChip[] }) {
  const [filter, setFilter] = useState<CourseFilter>(EMPTY_COURSE_FILTER);
  const [limit, setLimit] = useState(PAGE);
  const shown = useMemo(() => filterCourses(rows, filter), [rows, filter]);
  const topicName = useMemo(() => new Map(topics.map((t) => [t.id, t.label])), [topics]);
  const ng = useMemo(() => rows.filter((r) => r.instructors.includes(ANDREW_NG)).length, [rows]);
  // Platforms, most courses first, so the big providers lead the list.
  const platforms = useMemo(() => {
    const n = new Map<string, number>();
    for (const r of rows) n.set(platformOf(r.provider), (n.get(platformOf(r.provider)) ?? 0) + 1);
    return [...n].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [rows]);
  const set = (patch: Partial<CourseFilter>) => {
    setFilter((f) => ({ ...f, ...patch }));
    setLimit(PAGE);
  };
  const chips = [{ id: ALL, label: "All topics", count: rows.length, from: "#52525b", to: "#a1a1aa", icon: "compass" as IconName }, ...topics];
  const filtered = filter.topic !== ALL || filter.band !== ALL || filter.length !== ALL || filter.platform !== ALL || filter.andrewNg || filter.query.trim() !== "";

  return (
    <>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Search by title, teacher or lesson</span>
          <input type="search" value={filter.query} onChange={(e) => set({ query: e.target.value })} placeholder="For example: agents, Andrew Ng, RAG" className={field} />
        </label>

        <fieldset>
          <legend className="text-sm font-medium">Teacher</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" aria-pressed={filter.andrewNg} onClick={() => set({ andrewNg: !filter.andrewNg })} className={chip(filter.andrewNg)}>
              <span className="grid size-6 place-items-center rounded-full bg-violet-700 text-white">
                <Icon name="star" size={13} />
              </span>
              Taught by Andrew Ng
              <span className={filter.andrewNg ? "text-white/80 dark:text-black/70" : "text-zinc-600 dark:text-zinc-400"}>{ng}</span>
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">Topic</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {chips.map((t) => {
              const on = filter.topic === t.id;
              return (
                <button key={t.id} type="button" aria-pressed={on} onClick={() => set({ topic: t.id })} className={chip(on)}>
                  <span className="grid size-6 place-items-center rounded-full text-white" style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}>
                    <Icon name={t.icon} size={13} />
                  </span>
                  {t.label}
                  <span className={on ? "text-white/80 dark:text-black/70" : "text-zinc-600 dark:text-zinc-400"}>{t.count}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">From</span>
            <select value={filter.platform} onChange={(e) => set({ platform: e.target.value })} className={field}>
              <option value={ALL}>All platforms</option>
              {platforms.map(([p, n]) => (
                <option key={p} value={p}>
                  {p} ({n})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Level</span>
            <select value={filter.band} onChange={(e) => set({ band: e.target.value })} className={field}>
              {BANDS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Length</span>
            <select value={filter.length} onChange={(e) => set({ length: e.target.value as CourseLength })} className={field}>
              {LENGTHS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Sort by</span>
            <select value={filter.sort} onChange={(e) => set({ sort: e.target.value as CourseSort })} className={field}>
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
        Showing {Math.min(limit, shown.length)} of {shown.length}
        {filtered ? ` (${rows.length} in all)` : ""}
      </p>

      <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.slice(0, limit).map((c) => (
          <li key={c.id}>
            <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" aria-labelledby={`c-${c.id}`}>
              <CourseThumb provider={c.provider} kindLabel="Video course" embed={c.embed} hours={c.hours} certificate={false} className="h-36" />
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {c.provider} · {topicName.get(c.topics[0]) ?? c.topics[0]}
                </p>
                <h2 id={`c-${c.id}`} className="mt-1 text-lg leading-6 font-semibold">
                  {c.title}
                </h2>
                <p className="mt-1 text-sm">Taught by {c.instructors.join(", ")}</p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {formatHours(c.hours)} · {levelWords(c.level)} · {c.cost}
                </p>
                {c.lesson && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    For the lesson{" "}
                    <Link href={`/stop/${c.lesson.id}`} className="text-violet-800 underline underline-offset-2 dark:text-violet-300">
                      {c.lesson.title}
                    </Link>
                  </p>
                )}
                {c.notice && <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{c.notice}</p>}
                <div className="mt-auto pt-3">
                  {c.embed ? (
                    <WatchButton embed={c.embed} title={c.title} className={`self-start ${secondaryButtonSm}`} />
                  ) : (
                    <a href={`/go/${c.id}`} target="_blank" rel="noopener" className={`self-start ${secondaryButtonSm}`}>
                      Start the course
                      <Icon name="send" size={14} />
                      <span className="sr-only">: {c.title} (opens in a new tab)</span>
                    </a>
                  )}
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>

      {shown.length > limit && (
        <div className="mt-8 flex justify-center">
          <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="min-h-12 rounded-full border border-zinc-300 px-6 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
            Show more courses
          </button>
        </div>
      )}
      {shown.length === 0 && (
        <p className="mt-4">
          No courses match.{" "}
          <button type="button" onClick={() => set(EMPTY_COURSE_FILTER)} className="text-violet-800 underline underline-offset-2 dark:text-violet-300">
            Clear the filters
          </button>
        </p>
      )}
      <p className="mt-10 text-sm text-zinc-600 dark:text-zinc-400">
        Lecture series on YouTube play here. DeepLearning.AI courses play on their site after a free sign-up. A person picked the topic and lesson for every course; none of these links earns us money.
      </p>
    </>
  );
}
