// MB-13 (2026-11-27, owner: "Study from my notes & books" as a study set, like StudyFetch): a file opened once stays
// on this device as a study set, so its tests, flashcards and questions live in one place and it can be studied again
// without opening the file. Only on this device: the list (title, pages, sections) is in localStorage and the file's
// text (its excerpts) in IndexedDB, which the browser may refuse or clear. Then the set asks for the file again
// (ReopenFile); no test or deck depends on the stored text. Nothing reaches our servers (MB-4).
import { useMemo, useSyncExternalStore } from "react";
import { z } from "zod";
import type { Book } from "@/lib/book/chunk";
import { read, serverSnapshot, subscribe, write } from "./storage";

export const SETS_KEY = "xplaind.sets.v1";
export const MAX_SETS = 10;
const DB = "xplaind-study";
const STORE = "books";

const SetMeta = z.object({
  id: z.string().max(40),
  title: z.string().max(200),
  pages: z.number().int().min(0),
  sections: z.array(z.string().max(200)).max(400),
  createdOn: z.string().max(10),
  openedOn: z.string().max(10),
});
export type StudySet = z.infer<typeof SetMeta>;

export function parseSets(raw: string | null): StudySet[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as { version?: number; sets?: unknown[] };
    if (v?.version !== 1 || !Array.isArray(v.sets)) return [];
    return v.sets.flatMap((s) => {
      const p = SetMeta.safeParse(s);
      return p.success ? [p.data] : [];
    }).slice(0, MAX_SETS);
  } catch {
    return [];
  }
}

const saveList = (sets: StudySet[]) => write(SETS_KEY, JSON.stringify({ version: 1, sets: sets.slice(0, MAX_SETS) }));
const rawSets = () => read(SETS_KEY);

export function useStudySets(): StudySet[] {
  const raw = useSyncExternalStore(subscribe, rawSets, serverSnapshot);
  return useMemo(() => parseSets(raw), [raw]);
}

/**
 * Adds a set first in the list, or brings an existing one with the same title and page count back to the top, and
 * keeps the list to MAX_SETS. Pure, for tests: returns the new list, the set's id and the ids that fell off the end.
 */
export function placeSet(sets: StudySet[], book: Pick<Book, "title" | "pages" | "sections">, today: string, newId: string) {
  const same = sets.find((s) => s.title === book.title && s.pages === book.pages);
  const id = same?.id ?? newId;
  const entry: StudySet = { id, title: book.title.slice(0, 200), pages: book.pages, sections: book.sections.slice(0, 400), createdOn: same?.createdOn ?? today, openedOn: today };
  const list = [entry, ...sets.filter((s) => s.id !== id)];
  return { list: list.slice(0, MAX_SETS), id, dropped: list.slice(MAX_SETS).map((s) => s.id) };
}

function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no IndexedDB"));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise<T>((resolve, reject) => {
    const r = run(d.transaction(STORE, mode).objectStore(STORE));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  }).finally(() => d.close());
}

/** Keeps the opened file as a study set and returns its id. The text is cached when the browser allows it. */
export async function saveStudySet(book: Book, today: string): Promise<string> {
  const { list, id, dropped } = placeSet(parseSets(rawSets()), book, today, Math.random().toString(36).slice(2, 10));
  saveList(list);
  try {
    await tx("readwrite", (s) => s.put(book, id));
    for (const old of dropped) await tx("readwrite", (s) => s.delete(old));
  } catch {
    // Storage refused or full: the set still lists its tests and decks, and asks for the file when it needs the text.
  }
  return id;
}

/** The set's file as it was read, or null when the browser no longer has it. */
export async function loadStudySet(id: string): Promise<Book | null> {
  try {
    const book = (await tx("readonly", (s) => s.get(id))) as Book | undefined;
    return book && Array.isArray(book.chunks) ? book : null;
  } catch {
    return null;
  }
}

/** Removes the set and its stored text. Its tests and flashcards stay until they are deleted. */
export async function removeStudySet(id: string): Promise<void> {
  saveList(parseSets(rawSets()).filter((s) => s.id !== id));
  try {
    await tx("readwrite", (s) => s.delete(id));
  } catch {
    // Nothing stored, or storage blocked: the list entry is gone either way.
  }
}
