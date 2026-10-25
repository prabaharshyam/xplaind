// The course directory's filter and order (RM-2). Pure.
// ED-2: nothing in this file may read the affiliate or commission fields. The
// type below does not carry them, and resources.test.ts checks the source.
import { type LevelId, levelIndex } from "@/lib/levels";

export type DirectoryItem = {
  id: string;
  title: string;
  provider: string;
  type: string;
  level: LevelId;
  cost: "free" | "free_cert_paid" | "paid";
  hours: number;
  certificate: boolean;
  editorScore: number;
  /** Path ids whose lessons use this course. */
  paths: string[];
};

export type DirectoryFilter = {
  query: string;
  pathId: string;
  /** "all", or a band: "B" beginner, "I" intermediate, "P" professional. */
  band: string;
  type: string;
  certificateOnly: boolean;
};

export const ALL = "all";
export const EMPTY_FILTER: DirectoryFilter = { query: "", pathId: ALL, band: ALL, type: ALL, certificateOnly: false };

const normalise = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

export function matches(item: DirectoryItem, f: DirectoryFilter): boolean {
  if (f.pathId !== ALL && !item.paths.includes(f.pathId)) return false;
  if (f.band !== ALL && !item.level.startsWith(f.band)) return false;
  if (f.type !== ALL && item.type !== f.type) return false;
  if (f.certificateOnly && !item.certificate) return false;
  const words = normalise(f.query).split(/\s+/).filter(Boolean);
  const haystack = normalise(`${item.title} ${item.provider}`);
  return words.every((w) => haystack.includes(w));
}

/** Easiest level first; within a level, the editor's score, then free before paid, then title. */
export function orderDirectory<T extends DirectoryItem>(items: readonly T[]): T[] {
  const paid = (i: T) => (i.cost === "paid" ? 1 : 0);
  return [...items].sort(
    (a, b) =>
      levelIndex(a.level) - levelIndex(b.level) ||
      b.editorScore - a.editorScore ||
      paid(a) - paid(b) ||
      a.title.localeCompare(b.title),
  );
}

export function filterDirectory<T extends DirectoryItem>(items: readonly T[], f: DirectoryFilter): T[] {
  return orderDirectory(items.filter((i) => matches(i, f)));
}
