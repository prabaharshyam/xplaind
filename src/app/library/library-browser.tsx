"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/art/icons";
import { WatchButton } from "@/components/video-player";
import type { LibraryItem, LibraryKind } from "@/lib/content/library";
import type { ThemeId } from "@/lib/themes";

const KINDS: { id: LibraryKind | "all"; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "lesson", label: "Lessons" },
  { id: "video", label: "Video lessons" },
  { id: "skill", label: "Skills" },
];
const LEVELS = ["B1", "B2", "B3", "I1", "I2", "I3", "P1", "P2", "P3"] as const;
const PAGE = 48;

const chip = (on: boolean) =>
  `inline-flex min-h-10 items-center rounded-full px-3.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 ${
    on ? "bg-violet-700 text-white shadow-sm" : "bg-white text-zinc-800 ring-1 ring-zinc-300 hover:bg-violet-50 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-violet-950"
  }`;

const KIND_STYLE: Record<LibraryKind, string> = {
  lesson: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  video: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
  skill: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
};
const KIND_LABEL: Record<LibraryKind, string> = { lesson: "Lesson", video: "Video lesson", skill: "Skill" };

/** RM-10: filter lessons, video lessons and skills by tag. Filters live in the address, so a tag link opens the right view. */
export function LibraryBrowser({ items, topics, channels }: { items: LibraryItem[]; topics: { id: ThemeId; label: string }[]; channels: string[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const kind = (params.get("kind") as LibraryKind | null) ?? "all";
  const topic = params.get("topic") as ThemeId | null;
  const level = params.get("level");
  const channel = params.get("channel");
  const q = params.get("q") ?? "";
  const [shown, setShown] = useState(PAGE);

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
      <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-violet-50 via-sky-50 to-pink-50 p-4 ring-1 ring-violet-100 md:p-6 dark:from-violet-950/40 dark:via-sky-950/30 dark:to-pink-950/30 dark:ring-violet-900">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Search</span>
          <input
            type="search"
            value={q}
            onChange={(e) => set("q", e.target.value)}
            placeholder="Try RAG, Python, agents, interviews…"
            className="min-h-12 w-full rounded-2xl border border-zinc-300 bg-white px-4 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <fieldset>
          <legend className="text-sm font-semibold">Show</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button key={k.id} type="button" aria-pressed={kind === k.id} className={chip(kind === k.id)} onClick={() => set("kind", k.id)}>
                {k.label} <span className="ml-1.5 text-xs opacity-80">{count(k.id)}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold">Topic</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" aria-pressed={!topic} className={chip(!topic)} onClick={() => set("topic", null)}>
              All topics
            </button>
            {topics.map((t) => (
              <button key={t.id} type="button" aria-pressed={topic === t.id} className={chip(topic === t.id)} onClick={() => set("topic", topic === t.id ? null : t.id)}>
                #{t.label}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-col gap-4 md:flex-row">
          <fieldset className="md:flex-1">
            <legend className="text-sm font-semibold">Level</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {LEVELS.map((l) => (
                <button key={l} type="button" aria-pressed={level === l} className={chip(level === l)} onClick={() => set("level", level === l ? null : l)}>
                  {l}
                </button>
              ))}
            </div>
          </fieldset>
          {kind === "video" && (
            <label className="flex flex-col gap-1 md:w-64">
              <span className="text-sm font-semibold">Channel</span>
              <select value={channel ?? ""} onChange={(e) => set("channel", e.target.value || null)} className="min-h-12 rounded-2xl border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-900">
                <option value="">All channels</option>
                {channels.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      <p role="status" className="text-sm text-zinc-700 dark:text-zinc-300">
        {results.length} {results.length === 1 ? "result" : "results"}
      </p>

      <ul className="lx-deal grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.slice(0, shown).map((i) => (
          <li key={i.key} className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <p className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className={`rounded-full px-2 py-0.5 ${KIND_STYLE[i.kind]}`}>{KIND_LABEL[i.kind]}</span>
              {i.level && <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">{i.level}</span>}
              {i.minutes !== null && i.kind === "video" && <span className="text-zinc-600 dark:text-zinc-400">{i.minutes} min</span>}
            </p>
            <Link href={i.href} className="text-base leading-6 font-semibold hover:underline">
              {i.title}
            </Link>
            <p className="line-clamp-2 text-sm text-zinc-700 dark:text-zinc-300">{i.channel && i.kind === "video" ? `${i.channel} · ${i.summary}` : i.summary}</p>
            <p className="mt-auto flex flex-wrap gap-1.5 pt-1">
              {i.topics.map((t) => (
                <button key={t} type="button" onClick={() => set("topic", t)} className="rounded-full bg-violet-50 px-2 py-1 text-xs text-violet-900 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-200">
                  #{topics.find((x) => x.id === t)?.label ?? t}
                </button>
              ))}
              {i.tags.slice(0, 3).map((t) => (
                <button key={t} type="button" onClick={() => set("q", t)} className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200">
                  {t}
                </button>
              ))}
            </p>
            {i.kind === "lesson" && i.videos > 0 && (
              <p className="flex items-center gap-1 text-xs font-medium text-rose-700 dark:text-rose-300">
                <Icon name="play" size={12} /> {i.videos} video {i.videos === 1 ? "lesson" : "lessons"}
              </p>
            )}
            {i.embed && (
              <WatchButton
                embed={i.embed}
                title={i.title}
                className="mt-1 inline-flex min-h-10 items-center gap-1.5 self-start rounded-full bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
              />
            )}
          </li>
        ))}
      </ul>
      {results.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + PAGE)} className={`${chip(false)} self-center`}>
          Show more ({results.length - shown} left)
        </button>
      )}
      {results.length === 0 && <p className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">Nothing matches. Clear a filter or try another word.</p>}
    </div>
  );
}
