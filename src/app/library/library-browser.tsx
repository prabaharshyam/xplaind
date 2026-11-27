"use client";

import Link from "next/link";
import { secondaryButtonSm } from "@/components/ui";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { WatchButton } from "@/components/video-player";
import type { LibraryItem, LibraryKind } from "@/lib/content/library";
import type { ThemeId } from "@/lib/themes";
import { levelText } from "@/lib/levels";

const KINDS: { id: LibraryKind | "all"; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "lesson", label: "Lessons" },
  { id: "video", label: "Video lessons" },
  { id: "skill", label: "Skills" },
];
const LEVELS = ["B1", "B2", "B3", "I1", "I2", "I3", "P1", "P2", "P3"] as const;
const PAGE = 30;

const chip = (on: boolean) =>
  `inline-flex min-h-11 items-center rounded-full px-3.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
    on ? "bg-brand-700 text-white shadow-sm" : "bg-white text-zinc-800 ring-1 ring-zinc-300 hover:bg-brand-50 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-brand-950"
  }`;

const KIND_TEXT: Record<LibraryKind, string> = {
  lesson: "font-medium text-brand-800 dark:text-brand-300",
  video: "font-medium text-zinc-800 dark:text-zinc-200",
  skill: "font-medium text-zinc-800 dark:text-zinc-200",
};
const field = "min-h-11 w-full min-w-0 rounded-2xl border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950";
const KIND_LABEL: Record<LibraryKind, string> = { lesson: "Lesson", video: "Video lesson", skill: "Skill" };

/** RM-10: filter lessons, video lessons and skills by tag. Filters live in the address, so a tag link opens the right view. */
export function LibraryBrowser({
  items,
  topics,
  channels,
  topicGrid,
}: {
  items: LibraryItem[];
  topics: { id: ThemeId; label: string }[];
  channels: string[];
  /** LY-2: the cards of the "By topic" view, built on the server. */
  topicGrid: React.ReactNode;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const byTopic = params.get("view") === "topics";
  const kind = (params.get("kind") as LibraryKind | null) ?? "all";
  const topic = params.get("topic") as ThemeId | null;
  const level = params.get("level");
  const channel = params.get("channel");
  const q = params.get("q") ?? "";
  const [shown, setShown] = useState(PAGE);
  const active = [topic, level, channel].filter(Boolean).length;

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "" || value === "all") next.delete(key);
    else next.set(key, value);
    if (key === "kind" && value !== "video") next.delete("channel");
    setShown(PAGE);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((i) => {
      if (kind !== "all" && i.kind !== kind) return false;
      if (topic && !i.topics.includes(topic)) return false;
      if (level && i.level !== level) return false;
      if (channel && i.channel !== channel) return false;
      if (words.length) {
        const hay = `${i.title} ${i.summary} ${i.tags.join(" ")} ${i.channel ?? ""}`.toLowerCase();
        if (!words.every((w) => hay.includes(w))) return false;
      }
      return true;
    });
  }, [items, kind, topic, level, channel, q]);

  const count = (k: LibraryKind | "all") => (k === "all" ? items.length : items.filter((i) => i.kind === k).length);

  return (
    <div className="flex flex-col gap-5">
      {/* LY-2: Library and Topics are one page with two views. */}
      <div role="group" aria-label="View" className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={!byTopic} className={chip(!byTopic)} onClick={() => set("view", null)}>
          All lessons, videos and skills
        </button>
        <button type="button" aria-pressed={byTopic} className={chip(byTopic)} onClick={() => set("view", "topics")}>
          By topic
        </button>
      </div>

      {byTopic ? (
        topicGrid
      ) : (
        <>
      {/* LY-3 (2026-11-27, owner: "fix/do the 4-12", item 6): one toolbar of lists instead of walls of buttons, and
          compact rows instead of cards, so the results start on the first screen and the page is not 17 screens long. */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
        <label className="col-span-2 md:col-span-1">
          <span className="sr-only">Search</span>
          <input
            type="search"
            value={q}
            onChange={(e) => set("q", e.target.value)}
            placeholder="Search: RAG, Python, agents…"
            className={field}
          />
        </label>
        <label className="col-span-2 md:col-span-1">
          <span className="sr-only">Show</span>
          <select aria-label="Show" value={kind} onChange={(e) => set("kind", e.target.value)} className={field}>
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label} ({count(k.id)})
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Topic</span>
          <select aria-label="Topic" value={topic ?? ""} onChange={(e) => set("topic", e.target.value || null)} className={field}>
            <option value="">All topics</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Level</span>
          <select aria-label="Level" value={level ?? ""} onChange={(e) => set("level", e.target.value || null)} className={field}>
            <option value="">All levels</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {levelText(l)}
              </option>
            ))}
          </select>
        </label>
        {kind === "video" && (
          <label className="col-span-2 md:col-span-1">
            <span className="sr-only">Channel</span>
            <select aria-label="Channel" value={channel ?? ""} onChange={(e) => set("channel", e.target.value || null)} className={field}>
              <option value="">All channels</option>
              {channels.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm text-zinc-700 dark:text-zinc-300">
          {results.length} {results.length === 1 ? "result" : "results"}
        </p>
        {active > 0 && (
          <button type="button" onClick={() => router.replace(`${pathname}${kind !== "all" ? `?kind=${kind}` : ""}`, { scroll: false })} className="min-h-11 px-2 text-sm font-medium text-brand-800 underline underline-offset-4 dark:text-brand-300">
            Clear filters
          </button>
        )}
      </div>

      <ul aria-label="Results" className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
        {results.slice(0, shown).map((i) => (
          <li key={i.key} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:gap-4">
            <Link href={i.href} className="min-w-0 flex-1 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700">
              <span className="block leading-6 font-semibold hover:underline">{i.title}</span>
              <span className="mt-0.5 block text-sm text-zinc-600 dark:text-zinc-400">
                <span className={KIND_TEXT[i.kind]}>{KIND_LABEL[i.kind]}</span>
                {[
                  i.level ? levelText(i.level) : null,
                  i.topics.map((t) => topics.find((x) => x.id === t)?.label ?? t)[0] ?? null,
                  i.kind === "video" && i.minutes !== null ? `${i.minutes} min` : null,
                  i.kind === "video" ? i.channel : null,
                  i.kind === "lesson" && i.videos > 0 ? `${i.videos} video ${i.videos === 1 ? "lesson" : "lessons"}` : null,
                ]
                  .filter(Boolean)
                  .map((x) => ` · ${x}`)
                  .join("")}
              </span>
              <span className="mt-1 line-clamp-1 block text-sm text-zinc-700 max-sm:hidden dark:text-zinc-300">{i.summary}</span>
            </Link>
            {i.embed && <WatchButton embed={i.embed} title={i.title} className={`shrink-0 self-start ${secondaryButtonSm}`} />}
          </li>
        ))}
      </ul>
      {results.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + PAGE)} className={`${chip(false)} self-center`}>
          Show more ({results.length - shown} left)
        </button>
      )}
      {results.length === 0 && <p className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">Nothing matches. Clear a filter or try another word.</p>}
        </>
      )}
    </div>
  );
}
