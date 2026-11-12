// MB-8 to MB-10: the study loop for "Study from my notes & books". Ask your notes, test, retest
// what you missed, and bring cards back on a schedule. Pure: no network, no storage, no React,
// so it runs in the browser and in tests.
import type { Book, Chunk } from "./chunk";
import { FOCUS, type BookTest } from "./report";

// ------------------------------------------------------------- ask your notes --

const STOP = new Set(
  "a an the and or but if then than so of to in on at by for from with without about into over under as is are was were be been being do does did can could should would will may might must shall this that these those it its it's they them their there here what which who whom whose when where why how not no yes i me my we our you your he she his her also just only very more most such each any all some other same both either neither".split(
    " ",
  ),
);

/** Lower-case word stems worth matching: letters and digits, no stop words, a crude plural trim. */
export function terms(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => (w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w));
}

/** Most excerpts one question sends: enough to answer from, small enough to stay cheap. */
export const ASK_EXCERPTS = 6;

/**
 * MB-8: the excerpts most likely to answer a question, by how many of its rarer words they
 * share (a small BM25-style score). Returned in book order so the answer reads naturally.
 * An empty list means nothing in the file matches, and the tool says so without calling the AI.
 */
export function relevantExcerpts(book: Pick<Book, "chunks">, question: string, n = ASK_EXCERPTS): Chunk[] {
  const q = [...new Set(terms(question))];
  if (q.length === 0 || book.chunks.length === 0) return [];
  const docs = book.chunks.map((c) => terms(`${c.section} ${c.text}`));
  const avg = docs.reduce((s, d) => s + d.length, 0) / docs.length || 1;
  const df = new Map(q.map((t) => [t, docs.filter((d) => d.includes(t)).length]));
  const N = docs.length;
  const scored = docs.map((d, i) => {
    let score = 0;
    for (const t of q) {
      const f = d.filter((w) => w === t).length;
      if (!f) continue;
      const idf = Math.log(1 + (N - df.get(t)! + 0.5) / (df.get(t)! + 0.5));
      score += (idf * f * 2.2) / (f + 1.2 * (0.25 + (0.75 * d.length) / avg));
    }
    return { i, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, n)
    .sort((a, b) => a.i - b.i)
    .map((s) => book.chunks[s.i]);
}

// ---------------------------------------------------------------- retest --

/**
 * MB-9: the sections a "retest what I missed" covers: every section scored under 60%, or, when
 * none was that low, every section with at least one wrong or skipped answer. Book order.
 */
export function retestSections(test: Pick<BookTest, "questions">, answers: readonly (number | null)[]): string[] {
  const by = new Map<string, { right: number; total: number }>();
  test.questions.forEach((q, i) => {
    const s = by.get(q.section) ?? { right: 0, total: 0 };
    s.total++;
    if (answers[i] === q.answer) s.right++;
    by.set(q.section, s);
  });
  const weak = [...by].filter(([, s]) => (s.right / s.total) * 100 < FOCUS).map(([k]) => k);
  return weak.length ? weak : [...by].filter(([, s]) => s.right < s.total).map(([k]) => k);
}

/** How many questions a retest asks: two for each one missed, between 5 and 15. */
export function retestCount(test: Pick<BookTest, "questions">, answers: readonly (number | null)[]): number {
  const missed = test.questions.filter((q, i) => answers[i] !== q.answer).length;
  return Math.min(15, Math.max(5, missed * 2));
}

/** MB-10: the questions a learner missed, as review cards: the question, then the right answer and why. */
export function missedAsCards(test: Pick<BookTest, "questions">, answers: readonly (number | null)[]) {
  return test.questions
    .filter((q, i) => answers[i] !== q.answer)
    .slice(0, 30)
    .map((q, i) => ({
      id: `m${i + 1}`,
      front: q.question.slice(0, 400),
      back: `${q.options[q.answer]}. ${q.explanation}`.slice(0, 800),
      quote: q.quote.slice(0, 500),
      page: q.page,
      section: q.section.slice(0, 200),
    }));
}

// ------------------------------------------------------ spaced repetition --

/**
 * MB-10: days until a card comes back, by box. A card you knew moves up one box; a card you
 * marked "Again" goes back to box 0 and is due again tomorrow. Five right in a row is about a month.
 */
export const INTERVALS = [1, 2, 4, 8, 16, 32] as const;

export type Review = { box: number; due: string };

/** YYYY-MM-DD plus whole days, in calendar days (dates are already India dates). */
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function review(prev: Review | undefined, mark: "knew" | "again", today: string): Review {
  const box = mark === "again" ? 0 : Math.min(INTERVALS.length - 1, prev ? prev.box + 1 : 1);
  return { box, due: addDays(today, INTERVALS[box]) };
}

/** A card is due when it has never been reviewed or its date has come. */
export const isDue = (r: Review | undefined, today: string): boolean => !r || r.due <= today;

/** The cards due today, longest overdue first, then new cards in book order. */
export function dueCards<C extends { id: string }>(cards: readonly C[], schedule: Readonly<Record<string, Review>>, today: string): C[] {
  const seen = cards.filter((c) => schedule[c.id] && isDue(schedule[c.id], today)).sort((a, b) => (schedule[a.id].due < schedule[b.id].due ? -1 : schedule[a.id].due > schedule[b.id].due ? 1 : 0));
  return [...seen, ...cards.filter((c) => !schedule[c.id])];
}

/** The next date any card in a deck comes back, for "next review on …". */
export function nextDue(schedule: Readonly<Record<string, Review>>): string | null {
  const days = Object.values(schedule).map((r) => r.due).sort();
  return days[0] ?? null;
}
