"use client";

import { GateCard, useContentLocked } from "@/components/account/content-gate";

import Link from "next/link";
import { useMemo, useState } from "react";
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
/** CG-1: how many a signed-out visitor sees before the free sign-up card. */
const PREVIEW = 6;
const field =
  "min-h-11 w-full min-w-0 rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-base sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700";

/** VD-1: every video lesson, filtered by topic, level and length, sorted by views. Rendered on the server, so search engines see the first page of the list. */
export function VideoBrowser({ rows, topics, checkedOn }: { rows: VideoRow[]; topics: TopicChip[]; checkedOn: string | null }) {
  const [filter, setFilter] = useState<VideoFilter>(EMPTY_VIDEO_FILTER);
  const [limit, setLimit] = useState(PAGE);
  const locked = useContentLocked();
  const cap = locked ? PREVIEW : limit;
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
      {/* VD-4 (2026-11-27, owner: "fix/do the 4-12", item 6): one toolbar of lists instead of a wall of topic buttons. */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
        <label className="col-span-2 md:col-span-1">
          <span className="sr-only">Search by title, teacher or lesson</span>
          <input type="search" value={filter.query} onChange={(e) => set({ query: e.target.value })} placeholder="Search: attention, Krish Naik, RAG" className={field} />
        </label>
        <label className="col-span-2 md:col-span-1">
          <span className="sr-only">Topic</span>
          <select aria-label="Topic" value={filter.topic} onChange={(e) => set({ topic: e.target.value })} className={field}>
            {chips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} ({t.count})
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Level</span>
          <select aria-label="Level" value={filter.band} onChange={(e) => set({ band: e.target.value })} className={field}>
            {BANDS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Length</span>
          <select aria-label="Length" value={filter.length} onChange={(e) => set({ length: e.target.value as LengthBand })} className={field}>
            {LENGTHS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 md:col-span-1">
          <span className="sr-only">Sort by</span>
          <select aria-label="Sort by" value={filter.sort} onChange={(e) => set({ sort: e.target.value as SortKey })} className={field}>
            {SORTS.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
        Showing {Math.min(cap, shown.length)} of {shown.length}
        {filtered ? ` (${rows.length} in all)` : ""}
      </p>

      {/* VD-4: a row on a phone (small picture beside the text), a grid of pictures from 640 px, with no box around each. */}
      <ul className="mt-4 grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.slice(0, cap).map((v) => (
          <li key={v.id}>
            <article className="flex h-full gap-3 sm:flex-col" aria-labelledby={`v-${v.id}`}>
              <CourseThumb provider={v.channel ?? "YouTube"} kindLabel="Video lesson" embed={{ kind: "video", id: v.id }} hours={v.minutes / 60} certificate={false} className="h-20 w-32 shrink-0 rounded-2xl sm:h-40 sm:w-full" />
              <div className="flex min-w-0 flex-1 flex-col">
                <h2 id={`v-${v.id}`} className="leading-6 font-semibold sm:text-lg">
                  {v.title}
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {v.channel ?? "YouTube"} · {topicName.get(v.topics[0]) ?? v.topics[0]}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {v.views !== null ? `${formatViews(v.views)} views · ` : ""}
                  {formatMinutes(v.minutes)}
                  {v.level ? ` · ${levelWords(v.level)}` : ""}
                </p>
                {v.lesson && (
                  <p className="mt-1 text-sm text-zinc-600 max-sm:hidden dark:text-zinc-400">
                    For the lesson{" "}
                    <Link href={`/stop/${v.lesson.id}`} className="text-brand-800 underline underline-offset-2 dark:text-brand-300">
                      {v.lesson.title}
                    </Link>
                  </p>
                )}
                <WatchButton embed={{ kind: "video", id: v.id }} title={v.title} className={`mt-2 self-start sm:mt-auto sm:pt-0 ${secondaryButtonSm}`} />
              </div>
            </article>
          </li>
        ))}
      </ul>

      {!locked && shown.length > limit && (
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
      {locked && shown.length > PREVIEW && (
        <GateCard reason="videos" title="Sign up free to see every video lesson" text={`You are seeing the first ${PREVIEW} of ${shown.length}. Sign up to see them all, with filters by topic, level and length.`} />
      )}
      {shown.length === 0 && (
        <p className="mt-4">
          No videos match.{" "}
          <button type="button" onClick={() => set(EMPTY_VIDEO_FILTER)} className="text-brand-800 underline underline-offset-2 dark:text-brand-300">
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
