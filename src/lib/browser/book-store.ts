// "Ask me from my book" tests, kept on this device only (MB-4). The book itself is never
// saved: only the questions, their short quotes and the learner's answers.
import { useMemo, useSyncExternalStore } from "react";
import { z } from "zod";
import type { BookTest } from "@/lib/book/report";
import { read, serverSnapshot, subscribe, write } from "./storage";

export const BOOK_KEY = "xplaind.book.v1";
const MAX_TESTS = 10;

const Question = z.object({
  id: z.string().max(10),
  question: z.string().max(600),
  options: z.array(z.string().max(400)).length(4),
  answer: z.number().int().min(0).max(3),
  explanation: z.string().max(800),
  quote: z.string().max(500),
  page: z.number().int().min(1),
  section: z.string().max(200),
});
const Test = z.object({
  id: z.string().max(40),
  createdOn: z.string().max(10),
  book: z.string().max(200),
  difficulty: z.enum(["easy", "medium", "hard"]),
  minutes: z.number().int().min(1).max(180),
  questions: z.array(Question).min(1).max(30),
  result: z
    .object({ answers: z.array(z.number().int().min(0).max(3).nullable()), seconds: z.number().int().min(0), finishedOn: z.string().max(10) })
    .optional(),
});

export function parseBookTests(raw: string | null): BookTest[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as { version?: number; tests?: unknown[] };
    if (v?.version !== 1 || !Array.isArray(v.tests)) return [];
    return v.tests.flatMap((t) => {
      const p = Test.safeParse(t);
      return p.success ? [p.data] : [];
    }).slice(0, MAX_TESTS);
  } catch {
    return [];
  }
}

const rawTests = () => read(BOOK_KEY);
const save = (tests: BookTest[]) => write(BOOK_KEY, JSON.stringify({ version: 1, tests: tests.slice(0, MAX_TESTS) }));

export function useBookTests(): BookTest[] {
  const raw = useSyncExternalStore(subscribe, rawTests, serverSnapshot);
  return useMemo(() => parseBookTests(raw), [raw]);
}

/** Saves a new test first in the list and returns its id. */
export function addBookTest(test: Omit<BookTest, "id">): string {
  const id = Math.random().toString(36).slice(2, 10);
  save([{ ...test, id }, ...parseBookTests(rawTests())]);
  return id;
}

export function finishBookTest(id: string, result: NonNullable<BookTest["result"]>): void {
  save(parseBookTests(rawTests()).map((t) => (t.id === id ? { ...t, result } : t)));
}

/** Clears the answers so the same questions can be taken again. */
export function retakeBookTest(id: string): void {
  save(parseBookTests(rawTests()).map((t) => (t.id === id ? { ...t, result: undefined } : t)));
}

export function deleteBookTest(id: string): void {
  save(parseBookTests(rawTests()).filter((t) => t.id !== id));
}
