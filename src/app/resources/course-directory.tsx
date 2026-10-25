"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { card, muted, textLink } from "@/components/ui";
import { ALL, type DirectoryFilter, type DirectoryItem, EMPTY_FILTER, filterDirectory } from "@/lib/roadmap/directory";

export type DirectoryRow = DirectoryItem & {
  whyPicked: string;
  costLabel: string;
  /** Up to three lessons that use it, for the "Used in" line. */
  lessons: { id: string; title: string }[];
};

const BANDS = [
  { id: ALL, label: "Any level" },
  { id: "B", label: "Beginner (B1 to B3)" },
  { id: "I", label: "Intermediate (I1 to I3)" },
  { id: "P", label: "Professional (P1 to P3)" },
];

const TYPE_LABEL: Record<string, string> = {
  course: "Course",
  video: "Video",
  article: "Article",
  book: "Book",
  repo: "Code repository",
  tool: "Tool",
  docs: "Docs",
};

const field =
  "min-h-12 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700";

/** RM-2: every course, filterable. Rendered in full on the server, so search engines see the whole list. */
export function CourseDirectory({ rows, paths }: { rows: DirectoryRow[]; paths: { id: string; name: string }[] }) {
  const [filter, setFilter] = useState<DirectoryFilter>(EMPTY_FILTER);
  const shown = useMemo(() => filterDirectory(rows, filter), [rows, filter]);
  const types = useMemo(() => [...new Set(rows.map((r) => r.type))].sort(), [rows]);
  const set = (patch: Partial<DirectoryFilter>) => setFilter((f) => ({ ...f, ...patch }));

  return (
    <>
      <form role="search" aria-label="Filter courses" className="mt-6 grid gap-3 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-sm font-medium">Search by title or provider</span>
          <input
            type="search"
            value={filter.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="For example: prompting, Microsoft, agents"
            className={field}
          />
        </label>
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
            {types.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t] ?? t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-12 items-center gap-3 self-end">
          <input
            type="checkbox"
            checked={filter.certificateOnly}
            onChange={(e) => set({ certificateOnly: e.target.checked })}
            className="size-5 accent-emerald-700"
          />
          <span>Only courses with a certificate or badge</span>
        </label>
      </form>

      <p className={`mt-4 text-sm ${muted}`} aria-live="polite">
        Showing {shown.length} of {rows.length}
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {shown.map((r) => (
          <li key={r.id} className={card}>
            <h2 className="font-semibold">
              <a href={`/go/${r.id}`} target="_blank" rel="noopener" className={textLink}>
                {r.title}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </h2>
            <p className={`mt-1 text-sm ${muted}`}>
              {r.provider} · {TYPE_LABEL[r.type] ?? r.type} · {r.level} · about {r.hours} h · {r.costLabel}
              {r.certificate ? " · certificate or badge" : ""}
            </p>
            <p className="mt-2 leading-7">{r.whyPicked}</p>
            {r.lessons.length > 0 && (
              <p className={`mt-2 text-sm ${muted}`}>
                Used in:{" "}
                {r.lessons.map((l, i) => (
                  <span key={l.id}>
                    {i > 0 && ", "}
                    <Link href={`/stop/${l.id}`} className={textLink}>
                      {l.title}
                    </Link>
                  </span>
                ))}
              </p>
            )}
          </li>
        ))}
      </ul>
      {shown.length === 0 && (
        <p className="mt-4">
          Nothing matches. <button type="button" onClick={() => setFilter(EMPTY_FILTER)} className={textLink}>Clear the filters</button>
        </p>
      )}
    </>
  );
}
