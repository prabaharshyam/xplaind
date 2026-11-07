"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/art/icons";
import { CourseThumb } from "@/components/course-thumb";
import { WatchButton } from "@/components/video-player";
import { secondaryButtonSm } from "@/components/ui";
import { levelWords } from "@/lib/levels";
import { ALL, EMPTY_VIDEO_FILTER, type LengthBand, type SortKey, type VideoFilter, type VideoRow, filterVideos, formatMinutes, formatViews } from "@/lib/videos/browse";
import type { IconName } from "@/lib/themes";

export type TopicChip = { id: string; label: string; count: number; from: string; to: string; icon: IconName };

const BANDS = [
  { id: ALL, label: "Any level" },
  { id: "B", label: "Beginner" },
  { id: "I", label: "Intermediate" },
  { id: "P", label: "Professional" },
];
const LENGTHS: { id: LengthBand; label: string }[] = [
  { id: ALL, label: "Any length" },
  { id: "short", label: "Under 10 minutes" },
  { id: "medium", label: "10 to 30 minutes" },
  { id: "long", label: "Over 30 minutes" },
];
const SORTS: { id: SortKey; label: string }[] = [
  { id: "views", label: "Most viewed" },
  { id: "short", label: "Shortest first" },
  { id: "long", label: "Longest first" },
  { id: "level", label: "Easiest first" },
];

const PAGE = 24;
const field =
  "min-h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700";

/** VD-1: every video lesson, filtered by topic, level and length, sorted by views. Rendered on the server, so search engines see the first page of the list. */
export function VideoBrowser({ rows, topics, checkedOn }: { rows: VideoRow[]; topics: TopicChip[]; checkedOn: string | null }) {
  const [filter, setFilter] = useState<VideoFilter>(EMPTY_VIDEO_FILTER);
  const [limit, setLimit] = useState(PAGE);
  const shown = useMemo(() => filterVideos(rows, filter), [rows, filter]);
  const topicName = useMemo(() => new Map(topics.map((t) => [t.id, t.label])), [topics]);
  const set = (patch: Partial<VideoFilter>) => {
    setFilter((f) => ({ ...f, ...patch }));
    setLimit(PAGE);
  };
  const chips = [{ id: ALL, label: "All topics", count: rows.length, from: "#52525b", to: "#a1a1aa", icon: "compass" as IconName }, ...topics];
  const filtered = filter.topic !== ALL || filter.band !== ALL || filter.length !== ALL || filter.query.trim() !== "";

  return (
    <>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Search by title, teacher or lesson</span>
          <input
            type="search"
            value={filter.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="For example: attention, Krish Naik, RAG"
            className={field}
          />
        </label>

        <fieldset>
          <legend className="text-sm font-medium">Topic</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {chips.map((t) => {
              const on = filter.topic === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ topic: t.id })}
                  className={`flex min-h-11 items-center gap-2 rounded-full border py-1.5 pr-3 pl-1.5 text-sm ${
                    on ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black" : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  }`}
                >
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

        <div className="grid gap-3 sm:grid-cols-3">
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
            <select value={filter.length} onChange={(e) => set({ length: e.target.value as LengthBand })} className={field}>
              {LENGTHS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Sort by</span>
            <select value={filter.sort} onChange={(e) => set({ sort: e.target.value as SortKey })} className={field}>
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
        {shown.slice(0, limit).map((v) => (
          <li key={v.id}>
            <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" aria-labelledby={`v-${v.id}`}>
              <CourseThumb provider={v.channel ?? "YouTube"} kindLabel="Video lesson" embed={{ kind: "video", id: v.id }} hours={v.minutes / 60} certificate={false} className="h-36" />
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {v.channel ?? "YouTube"} · {topicName.get(v.topics[0]) ?? v.topics[0]}
                </p>
                <h2 id={`v-${v.id}`} className="mt-1 text-lg leading-6 font-semibold">
                  {v.title}
                </h2>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {v.views !== null ? `${formatViews(v.views)} views · ` : ""}
                  {formatMinutes(v.minutes)}
                  {v.level ? ` · ${levelWords(v.level)}` : ""}
                </p>
                {v.lesson && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    For the lesson{" "}
                    <Link href={`/stop/${v.lesson.id}`} className="text-violet-800 underline underline-offset-2 dark:text-violet-300">
                      {v.lesson.title}
                    </Link>
                  </p>
                )}
                <WatchButton embed={{ kind: "video", id: v.id }} title={v.title} className={`mt-auto self-start ${secondaryButtonSm}`} />
              </div>
            </article>
          </li>
        ))}
      </ul>

      {shown.length > limit && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setLimit((l) => l + PAGE)}
            className="min-h-12 rounded-full border border-zinc-300 px-6 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Show more videos
          </button>
        </div>
      )}
      {shown.length === 0 && (
        <p className="mt-4">
          No videos match.{" "}
          <button type="button" onClick={() => set(EMPTY_VIDEO_FILTER)} className="text-violet-800 underline underline-offset-2 dark:text-violet-300">
            Clear the filters
          </button>
        </p>
      )}
      {checkedOn && (
        <p className="mt-10 text-sm text-zinc-600 dark:text-zinc-400">
          View counts are public YouTube numbers, read on {checkedOn}. More views does not mean better: a person picked every video here.
        </p>
      )}
    </>
  );
}
