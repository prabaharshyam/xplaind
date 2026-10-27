// MB-1: turns a learner's book into numbered excerpts and picks the ones a test is
// written from. Pure: no PDF library, no network, so it runs in the browser and in tests.

export type BookPage = { n: number; text: string };
/** A chapter or section, from the PDF's outline or the headings of a text file. */
export type BookSection = { title: string; startPage: number };
export type Chunk = { id: string; page: number; section: string; text: string };
export type Book = { title: string; pages: number; sections: string[]; chunks: Chunk[] };

/** Excerpt length in characters: about 250 words, enough for one or two questions. */
export const CHUNK_CHARS = 1200;
/** Most excerpts one test sends, which bounds what a test costs. */
export const MAX_EXCERPTS = 30;

const clean = (s: string) =>
  s
    .replace(/­/g, "")
    .replace(/-\n(?=[a-z])/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();

/** Text a question can be written from: mostly words, not a contents page or a table of numbers. */
export function usable(text: string): boolean {
  const letters = (text.match(/\p{L}/gu) ?? []).length;
  const words = text.split(/\s+/).filter((w) => /\p{L}{3,}/u.test(w)).length;
  return text.length >= 300 && letters / text.length > 0.6 && words >= 50 && !/(\.{4,}|…{2,})\s*\d+/.test(text.slice(0, 400));
}

/** Splits text at sentence ends into pieces of about `size` characters. */
export function splitText(text: string, size = CHUNK_CHARS): string[] {
  const sentences = text.replace(/\n+/g, " ").match(/[^.!?]+[.!?]+["”’)]*\s*|[^.!?]+$/g) ?? [];
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if (cur && cur.length + s.length > size) {
      out.push(cur.trim());
      cur = "";
    }
    cur += s;
    // A run-on with no sentence ends is cut hard, so no excerpt grows without bound.
    while (cur.length > size * 1.5) {
      out.push(cur.slice(0, size).trim());
      cur = cur.slice(size);
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** When a book has no outline, it is split into parts of about ten pages each. */
export function fallbackSections(pageCount: number): BookSection[] {
  const per = pageCount <= 20 ? Math.max(1, Math.ceil(pageCount / 4)) : 10;
  const out: BookSection[] = [];
  for (let p = 1; p <= pageCount; p += per) out.push({ title: `Pages ${p}–${Math.min(pageCount, p + per - 1)}`, startPage: p });
  return out;
}

/** The section a page belongs to: the last one that starts on or before it. */
function sectionOf(page: number, sections: BookSection[]): string {
  let title = sections[0]?.title ?? "Book";
  for (const s of sections) if (s.startPage <= page) title = s.title;
  return title;
}

export function buildBook(title: string, pages: BookPage[], outline: BookSection[]): Book {
  const sorted = [...outline].filter((s) => s.title.trim()).sort((a, b) => a.startPage - b.startPage);
  const sections = sorted.length >= 2 ? sorted : fallbackSections(pages.length);
  const chunks: Chunk[] = [];
  for (const p of pages) {
    const text = clean(p.text);
    if (!text) continue;
    for (const piece of splitText(text)) {
      if (!usable(piece)) continue;
      chunks.push({ id: `c${chunks.length + 1}`, page: p.n, section: sectionOf(p.n, sections), text: piece });
    }
  }
  const used = new Set(chunks.map((c) => c.section));
  return { title, pages: pages.length, sections: sections.map((s) => s.title).filter((t, i, all) => used.has(t) && all.indexOf(t) === i), chunks };
}

/** Headings of a plain-text or Markdown book become its sections; every 3,000 characters is a "page". */
export function pagesFromText(text: string): { pages: BookPage[]; outline: BookSection[] } {
  const pages: BookPage[] = [];
  const outline: BookSection[] = [];
  let buf = "";
  const flush = () => {
    if (buf.trim()) pages.push({ n: pages.length + 1, text: buf });
    buf = "";
  };
  for (const line of text.split(/\r?\n/)) {
    const h = line.match(/^#{1,3}\s+(.+)$/) ?? line.match(/^(chapter\s+\d+[^\n]{0,80})$/i);
    if (h) {
      flush();
      outline.push({ title: h[1].trim().slice(0, 120), startPage: pages.length + 1 });
      continue;
    }
    buf += `${line}\n`;
    if (buf.length >= 3000) flush();
  }
  flush();
  return { pages, outline };
}

/**
 * The excerpts a test is written from: spread over the chosen sections in turn, and
 * evenly through each one, so the test covers the whole of what the learner picked.
 * A couple of spares per test let the model skip an excerpt that makes a poor question.
 */
export function pickExcerpts(book: Book, sections: readonly string[], questions: number): Chunk[] {
  const want = Math.min(MAX_EXCERPTS, questions + Math.max(2, Math.ceil(questions / 4)));
  const chosen = sections.length ? sections : book.sections;
  const pools = chosen.map((s) => book.chunks.filter((c) => c.section === s)).filter((p) => p.length);
  if (pools.length === 0) return [];
  const total = pools.reduce((n, p) => n + p.length, 0);
  // Each section's share follows its length, with at least one excerpt each while there is room.
  const shares = pools.map((p) => Math.max(1, Math.round((p.length / total) * want)));
  while (shares.reduce((a, b) => a + b, 0) > want) {
    const i = shares.indexOf(Math.max(...shares));
    if (shares[i] <= 1) break;
    shares[i]--;
  }
  const picked: Chunk[] = [];
  pools.forEach((pool, i) => {
    const n = Math.min(shares[i], pool.length);
    for (let k = 0; k < n; k++) picked.push(pool[Math.floor(((k + 0.5) * pool.length) / n)]);
  });
  return picked.slice(0, want);
}
