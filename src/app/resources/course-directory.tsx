"use client";

import { ResourceNotice } from "@/components/resource-card";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Cover } from "@/components/art/cover";
import { Icon } from "@/components/art/icons";
import { ALL, type DirectoryFilter, type DirectoryItem, EMPTY_FILTER, filterDirectory } from "@/lib/roadmap/directory";
import { THEMES, type ThemeId, themeOf } from "@/lib/themes";

export type DirectoryRow = DirectoryItem & {
  whyPicked: string;
  costLabel: string;
  /** Up to three lessons that use it, for the "Used in" line. */
  lessons: { id: string; title: string }[];
  /** "Video lesson", "Course" and so on (media.ts). */
  kindLabel: string;
  /** A warning to show under the link, such as an age limit. */
  notice: string | null;
};

const BANDS = [
  { id: ALL, label: "Any level" },
  { id: "B", label: "Beginner" },
  { id: "I", label: "Intermediate" },
  { id: "P", label: "Professional" },
];

const TYPE_LABEL: Record<string, string> = {
  course: "Course",
  video: "Video",
  article: "Article",
  book: "Book",
  repo: "Code",
  tool: "Tool",
  docs: "Docs",
};

const PAGE = 24;

const field =
  "min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700";

/** RM-2: every course as a picture card, filterable. Rendered on the server, so search engines see the list. */
export function CourseDirectory({ rows, paths }: { rows: DirectoryRow[]; paths: { id: string; name: string }[] }) {
  const [filter, setFilter] = useState<DirectoryFilter>(EMPTY_FILTER);
  const [limit, setLimit] = useState(PAGE);
  const shown = useMemo(() => filterDirectory(rows, filter), [rows, filter]);
  const themes = useMemo(() => THEMES.filter((t) => rows.some((r) => r.themes.includes(t.id))), [rows]);
  const set = (patch: Partial<DirectoryFilter>) => {
    setFilter((f) => ({ ...f, ...patch }));
    setLimit(PAGE);
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Search by title or provider</span>
          <input
            type="search"
            value={filter.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="For example: prompting, Microsoft, agents"
            className={field}
          />
        </label>

        <fieldset>
          <legend className="text-sm font-medium">Topic</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[{ id: ALL, label: "All topics", from: "#52525b", to: "#a1a1aa", icon: "compass" as const }, ...themes].map((t) => {
              const on = filter.theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ theme: t.id })}
                  className={`flex min-h-10 items-center gap-2 rounded-full border py-1.5 pr-3 pl-1.5 text-sm ${
                    on ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black" : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="grid size-6 place-items-center rounded-full text-white" style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}>
                    <Icon name={t.icon} size={13} />
                  </span>
                  {t.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Path</span>
            <select value={filter.pathId} onChange={(e) => set({ pathId: e.target.value })} className={field}>
              <option value={ALL}>Every path</option>
              {paths.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
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
            <span className="text-sm font-medium">Type</span>
            <select value={filter.type} onChange={(e) => set({ type: e.target.value })} className={field}>
              <option value={ALL}>Any type</option>
              {Object.entries(TYPE_LABEL).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-zinc-300 px-3 dark:border-zinc-700">
            <input
              type="checkbox"
              checked={filter.certificateOnly}
              onChange={(e) => set({ certificateOnly: e.target.checked })}
              className="size-5 accent-emerald-700"
            />
            <span className="text-sm">Only courses with a certificate or badge</span>
          </label>
        </div>
      </div>

      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
        Showing {Math.min(limit, shown.length)} of {shown.length}
        {shown.length !== rows.length ? ` (${rows.length} in all)` : ""}
      </p>

      <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.slice(0, limit).map((r) => (
          <li key={r.id}>
            <CourseCard r={r} />
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
            Show more courses
          </button>
        </div>
      )}
      {shown.length === 0 && (
        <p className="mt-4">
          Nothing matches.{" "}
          <button type="button" onClick={() => set(EMPTY_FILTER)} className="text-emerald-800 underline underline-offset-2 dark:text-emerald-400">
            Clear the filters
          </button>
        </p>
      )}
    </>
  );
}

function CourseCard({ r }: { r: DirectoryRow }) {
  const theme = (r.themes[0] ?? "ai-basics") as ThemeId;
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative">
        <Cover theme={theme} seed={r.id} className="h-32" iconSize={34} label={r.provider} />
        <span className="absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur">
          {r.kindLabel}
        </span>
        {r.certificate && (
          <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-amber-300 px-2.5 py-0.5 text-xs font-semibold text-amber-950">
            <Icon name="cert" size={12} /> Certificate
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {r.provider} · {themeOf(theme).label}
        </p>
        <h2 className="mt-1 text-lg leading-6 font-semibold">
          <a href={`/go/${r.id}`} target="_blank" rel="noopener" className="hover:underline">
            {r.title}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </h2>
        {r.notice && <ResourceNotice text={r.notice} compact />}
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{r.whyPicked}</p>
        <p className="mt-3 flex flex-wrap gap-1.5 text-xs">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">{r.costLabel}</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">{r.level}</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">about {r.hours} h</span>
        </p>
        {r.lessons.length > 0 && (
          <p className="mt-auto pt-3 text-xs text-zinc-600 dark:text-zinc-400">
            Used in:{" "}
            {r.lessons.map((l, i) => (
              <span key={l.id}>
                {i > 0 && ", "}
                <Link href={`/stop/${l.id}`} className="underline underline-offset-2">
                  {l.title}
                </Link>
              </span>
            ))}
          </p>
        )}
      </div>
    </article>
  );
}
