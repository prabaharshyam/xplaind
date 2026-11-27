// MB-15: study notes written from the learner's file, kept on this device only, like its tests and decks (MB-4).
import { useMemo, useSyncExternalStore } from "react";
import { z } from "zod";
import { read, serverSnapshot, subscribe, write } from "./storage";

export const NOTES_KEY = "xplaind.book-notes.v1";
const MAX_NOTES = 20;

const Point = z.object({ term: z.string().max(80), text: z.string().max(400), quote: z.string().max(400), page: z.number().int().min(1), section: z.string().max(200) });
const Notes = z.object({
  id: z.string().max(40),
  book: z.string().max(200),
  createdOn: z.string().max(10),
  depth: z.enum(["summary", "detailed"]),
  sections: z.array(z.object({ heading: z.string().max(80), points: z.array(Point).min(1).max(8) })).min(1).max(12),
});
export type BookNotes = z.infer<typeof Notes>;

export function parseNotes(raw: string | null): BookNotes[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as { version?: number; notes?: unknown[] };
    if (v?.version !== 1 || !Array.isArray(v.notes)) return [];
    return v.notes.flatMap((n) => {
      const p = Notes.safeParse(n);
      return p.success ? [p.data] : [];
    }).slice(0, MAX_NOTES);
  } catch {
    return [];
  }
}

const raw = () => read(NOTES_KEY);
const save = (notes: BookNotes[]) => write(NOTES_KEY, JSON.stringify({ version: 1, notes: notes.slice(0, MAX_NOTES) }));

export function useBookNotes(): BookNotes[] {
  const r = useSyncExternalStore(subscribe, raw, serverSnapshot);
  return useMemo(() => parseNotes(r), [r]);
}

/** Saves new notes first in the list and returns their id. */
export function addNotes(notes: Omit<BookNotes, "id">): string {
  const id = Math.random().toString(36).slice(2, 10);
  save([{ ...notes, id }, ...parseNotes(raw())]);
  return id;
}

export function deleteNotes(id: string): void {
  save(parseNotes(raw()).filter((n) => n.id !== id));
}
