// XB-2: X Bot's instant answers, matched against the site's own content. Pure, so it
// runs in the browser and in tests, and never calls a model.
import { stem } from "@/lib/interview/analyse";

export type BotKind = "guide" | "term" | "lesson" | "question" | "project" | "path";
/** One thing X Bot can point to: title, the answer text it shows, link, extra keywords. */
export type BotEntry = { k: BotKind; t: string; a: string; h: string; w?: string };

export const BOT_KIND_LABEL: Record<BotKind, string> = {
  guide: "How to",
  term: "Glossary",
  lesson: "Lesson",
  question: "Interview question",
  project: "Project",
  path: "Roadmap",
};

/** Question words and filler that say nothing about the topic. */
const STOP = new Set(
  (
    "a an the is are was were be been am do does did can could should would will shall may might must i me my we our you your " +
    "it its this that these those of in on at to for from by with about into as and or but if so than then there here " +
    "what whats which who whom why how when where explain tell show give help please define meaning mean means difference between " +
    "vs versus want need know learn understand get use using used make some any something thing things like just really very simple simply " +
    "hi hello hey xbot bot ok okay thanks thank"
  ).split(" "),
);

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** The topic words of a query or a text, stemmed, without question words. */
export function queryTerms(text: string): string[] {
  const out: string[] = [];
  for (const w of norm(text).split(" ")) {
    if (!w || STOP.has(w)) continue;
    const s = w.length > 3 ? stem(w) : w;
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

const termSet = (text: string) => new Set(norm(text).split(" ").filter(Boolean).map((w) => (w.length > 3 ? stem(w) : w)));

export type Intent = "define" | "howto" | "interview" | "project" | "general";

export function intentOf(query: string): Intent {
  const q = ` ${norm(query)} `;
  if (/ (interview|interviewer) /.test(q)) return "interview";
  if (/ (project|projects|portfolio|build something) /.test(q)) return "project";
  if (/ (how do i|how can i|where (do|can|is)|how to (mark|use|find|see|save|start|sign)|can i) /.test(q)) return "howto";
  if (/ (what is|what are|whats|define|meaning|explain|difference) /.test(q)) return "define";
  return "general";
}

const INTENT_BONUS: Record<Intent, Partial<Record<BotKind, number>>> = {
  define: { term: 3, lesson: 2 },
  howto: { guide: 4 },
  interview: { question: 3, guide: 1 },
  project: { project: 3, guide: 1 },
  general: { term: 1, lesson: 1, guide: 1 },
};

const KIND_WORDS: Partial<Record<Intent, string[]>> = {
  interview: ["interview", "interviewer", "question"],
  project: ["project", "portfolio", "build"],
};

export type Scored = { entry: BotEntry; score: number };

/** Ranks entries for a question. An entry must share at least half the question's topic words. */
export function rank(query: string, entries: readonly BotEntry[], limit = 5): Scored[] {
  const intent = intentOf(query);
  let terms = queryTerms(query);
  // "RAG interview questions": the intent picks the kind, the rest picks the topic.
  const kindWords = KIND_WORDS[intent] && queryTerms(KIND_WORDS[intent].join(" "));
  if (kindWords && terms.some((t) => !kindWords.includes(t))) terms = terms.filter((t) => !kindWords.includes(t));
  if (terms.length === 0) return [];
  const need = Math.max(1, Math.ceil(terms.length / 2));
  const joined = terms.join(" ");
  const out: Scored[] = [];
  for (const entry of entries) {
    const title = termSet(entry.t);
    const words = termSet(entry.w ?? "");
    const body = termSet(entry.a);
    let hits = 0;
    let score = 0;
    for (const t of terms) {
      if (title.has(t)) score += 4;
      else if (words.has(t)) score += 3;
      else if (body.has(t)) score += 1;
      else continue;
      hits++;
    }
    if (hits < need) continue;
    score += hits === terms.length ? 3 : 0;
    // "what is rag" → the RAG entry itself, unless the learner asked for a kind of thing.
    if (!kindWords && queryTerms(entry.t).join(" ") === joined) score += 8;
    score += INTENT_BONUS[intent][entry.k] ?? 0;
    out.push({ entry, score });
  }
  return out.sort((a, b) => b.score - a.score || a.entry.t.length - b.entry.t.length).slice(0, limit);
}

export type BotAnswer = {
  /** The one entry whose text answers the question, when the match is strong. */
  lead: BotEntry | null;
  /** Other places to look, best first. */
  more: BotEntry[];
};

/** X Bot's reply from the site alone: a direct answer when one fits, and links to read next. */
export function answer(query: string, entries: readonly BotEntry[]): BotAnswer {
  const ranked = rank(query, entries, 6);
  if (ranked.length === 0) return { lead: null, more: [] };
  const [top, ...rest] = ranked;
  const strong = top.score >= 7 && top.entry.k !== "path";
  return strong ? { lead: top.entry, more: rest.slice(0, 4).map((r) => r.entry) } : { lead: null, more: ranked.slice(0, 5).map((r) => r.entry) };
}

/** The entry for the page the learner is on, so X Bot can say what it is about. */
export const entryForPage = (pathname: string, entries: readonly BotEntry[]): BotEntry | undefined =>
  pathname === "/" ? undefined : entries.find((e) => e.k !== "guide" && e.h === pathname);
