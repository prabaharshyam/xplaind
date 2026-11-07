// VD-1: the Videos page's filter, sort and number formats. Pure: no React, no database.
// The only ranking input is public view count and length. Nothing here reads paid or
// partner fields (ED-2).
import { type LevelId, levelIndex } from "@/lib/levels";

export type VideoRow = {
  /** YouTube video id. */
  id: string;
  title: string;
  channel: string | null;
  topics: string[];
  level: LevelId | null;
  minutes: number;
  /** Public view count, or null when we have not read it. */
  views: number | null;
  /** The lesson this video belongs to, when it belongs to one. */
  lesson: { id: string; title: string } | null;
};

export const ALL = "all";
export type SortKey = "views" | "short" | "long" | "level";
export type LengthBand = typeof ALL | "short" | "medium" | "long";

export type VideoFilter = {
  query: string;
  topic: string;
  /** "all", or a band: "B" beginner, "I" intermediate, "P" professional. */
  band: string;
  length: LengthBand;
  sort: SortKey;
};

export const EMPTY_VIDEO_FILTER: VideoFilter = { query: "", topic: ALL, band: ALL, length: ALL, sort: "views" };

const normalise = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

/** Under 10 minutes, 10 to 30 minutes, over 30 minutes. */
export function lengthBand(minutes: number): Exclude<LengthBand, "all"> {
  return minutes < 10 ? "short" : minutes <= 30 ? "medium" : "long";
}

export function matches(row: VideoRow, f: VideoFilter): boolean {
  if (f.topic !== ALL && !row.topics.includes(f.topic)) return false;
  if (f.band !== ALL && !(row.level && row.level.startsWith(f.band))) return false;
  if (f.length !== ALL && lengthBand(row.minutes) !== f.length) return false;
  const words = normalise(f.query).split(/\s+/).filter(Boolean);
  const haystack = normalise(`${row.title} ${row.channel ?? ""} ${row.lesson?.title ?? ""}`);
  return words.every((w) => haystack.includes(w));
}

const byViews = (a: VideoRow, b: VideoRow) => (b.views ?? -1) - (a.views ?? -1);

/** Sorts a copy. Ties fall back to the title so the order never flickers. */
export function sortVideos<T extends VideoRow>(rows: readonly T[], sort: SortKey): T[] {
  const order: Record<SortKey, (a: T, b: T) => number> = {
    views: byViews,
    short: (a, b) => a.minutes - b.minutes || byViews(a, b),
    long: (a, b) => b.minutes - a.minutes || byViews(a, b),
    // Easiest first; videos with no level (from channels) come after the levelled ones.
    level: (a, b) => (a.level ? levelIndex(a.level) : 99) - (b.level ? levelIndex(b.level) : 99) || byViews(a, b),
  };
  return [...rows].sort((a, b) => order[sort](a, b) || a.title.localeCompare(b.title));
}

export function filterVideos<T extends VideoRow>(rows: readonly T[], f: VideoFilter): T[] {
  return sortVideos(rows.filter((r) => matches(r, f)), f.sort);
}

/** How many videos each topic has, most first. */
export function topicCounts(rows: readonly VideoRow[]): { topic: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of rows) for (const t of r.topics) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts].map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
}

/** 840, 3.4K, 45K, 1.2M. Always rounds down, so we never claim more than the real count. */
export function formatViews(n: number): string {
  const trim = (x: number) => String(Math.floor(x * 10) / 10).replace(/\.0$/, "");
  if (n >= 1_000_000) return `${trim(n / 1_000_000)}M`;
  if (n >= 10_000) return `${Math.floor(n / 1000)}K`;
  if (n >= 1000) return `${trim(n / 1000)}K`;
  return String(n);
}

export function formatMinutes(minutes: number): string {
  return minutes < 90 ? `${minutes} min` : `${Math.round(minutes / 6) / 10} h`;
}
