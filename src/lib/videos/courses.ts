// VD-2: the Video courses tab of /videos: filter and sort. Pure: no React, no database.
// Sorting reads only the publish date, length and level, never paid or partner fields (ED-2).
import type { Embed } from "@/lib/content/media";
import { type LevelId, levelIndex } from "@/lib/levels";
import { ALL } from "./browse";

export type CourseRow = {
  /** Resource id. */
  id: string;
  title: string;
  provider: string;
  instructors: string[];
  topics: string[];
  level: LevelId;
  hours: number;
  /** YYYY-MM-DD, or null when the provider does not say. */
  published: string | null;
  /** "Free", "Free to learn, paid certificate", or a price with its check date (RM-6). */
  cost: string;
  /** Plays on the page when set; otherwise the course opens on the provider's site. */
  embed: Embed | null;
  notice: string | null;
  /** The first lesson that lists this course, when one does. */
  lesson: { id: string; title: string } | null;
};

export type CourseSort = "newest" | "short" | "long" | "level";
export type CourseLength = typeof ALL | "short" | "medium" | "long";

export type CourseFilter = {
  query: string;
  topic: string;
  /** "all", or "B", "I" or "P". */
  band: string;
  length: CourseLength;
  /** Only courses Andrew Ng teaches. */
  andrewNg: boolean;
  /** "all", or a platform from platformOf, such as "Anthropic". */
  platform: string;
  sort: CourseSort;
};

export const EMPTY_COURSE_FILTER: CourseFilter = { query: "", topic: ALL, band: ALL, length: ALL, andrewNg: false, platform: ALL, sort: "newest" };

/** The platform a course comes from, so "Anthropic Academy" and "Anthropic" file together. */
export function platformOf(provider: string): string {
  const p = provider.toLowerCase();
  if (p.includes("deeplearning")) return "DeepLearning.AI";
  if (p.includes("anthropic") || p.includes("claude")) return "Anthropic";
  if (p.includes("google")) return "Google";
  if (p.includes("microsoft")) return "Microsoft";
  if (p.includes("nvidia")) return "NVIDIA";
  if (p.includes("stanford")) return "Stanford";
  if (p.includes("harvard") || p.includes("cs50")) return "Harvard";
  return provider;
}

export const ANDREW_NG = "Andrew Ng";

const normalise = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

/** Under 2 hours, 2 to 10 hours, over 10 hours. */
export function courseLength(hours: number): Exclude<CourseLength, "all"> {
  return hours < 2 ? "short" : hours <= 10 ? "medium" : "long";
}

export function matchesCourse(row: CourseRow, f: CourseFilter): boolean {
  if (f.topic !== ALL && !row.topics.includes(f.topic)) return false;
  if (f.band !== ALL && !row.level.startsWith(f.band)) return false;
  if (f.length !== ALL && courseLength(row.hours) !== f.length) return false;
  if (f.andrewNg && !row.instructors.includes(ANDREW_NG)) return false;
  if (f.platform !== ALL && platformOf(row.provider) !== f.platform) return false;
  const words = normalise(f.query).split(/\s+/).filter(Boolean);
  const haystack = normalise(`${row.title} ${row.provider} ${row.instructors.join(" ")} ${row.lesson?.title ?? ""}`);
  return words.every((w) => haystack.includes(w));
}

const newest = (a: CourseRow, b: CourseRow) => (b.published ?? "").localeCompare(a.published ?? "");

/** Sorts a copy. Ties fall back to the title so the order never flickers. */
export function sortCourses<T extends CourseRow>(rows: readonly T[], sort: CourseSort): T[] {
  const order: Record<CourseSort, (a: T, b: T) => number> = {
    newest,
    short: (a, b) => a.hours - b.hours,
    long: (a, b) => b.hours - a.hours,
    level: (a, b) => levelIndex(a.level) - levelIndex(b.level),
  };
  return [...rows].sort((a, b) => order[sort](a, b) || a.title.localeCompare(b.title));
}

export function filterCourses<T extends CourseRow>(rows: readonly T[], f: CourseFilter): T[] {
  return sortCourses(rows.filter((r) => matchesCourse(r, f)), f.sort);
}

/** About 45 min, about 2.5 hours, about 60 hours. */
export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  const h = hours < 10 ? Math.round(hours * 2) / 2 : Math.round(hours);
  return `about ${h} ${h === 1 ? "hour" : "hours"}`;
}
