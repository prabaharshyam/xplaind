// VS-1 and the release 3 report, done without a model: checks a spoken or typed
// answer against the question's rubric and measures delivery from the transcript.
// Pure: no DOM, no network, no storage. Release 1 makes no model calls.

export type RubricPoint = { point: string; keywords: readonly string[] };

export type SimQuestion = {
  id: string;
  question: string;
  short_answer: string;
  /** The fuller reference answer, used to judge how close an answer is to it. */
  deeper_answer?: string;
  level: string;
  topic: string;
  paths: readonly string[];
  rubric: readonly RubricPoint[];
  answer_seconds: number;
  stop: { id: string; title: string };
};

/** Lower case, straight apostrophes, punctuation and hyphens turned into spaces, single spaces. */
export function normalise(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9'%/+\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * A keyword matches at the start of a word, so "retriev" matches "retrieval" and
 * "retrieved" but "rag" does not match "drag". Multi-word keywords must appear as
 * written, apart from punctuation.
 */
export function findKeyword(normalisedText: string, keyword: string): boolean {
  const k = normalise(keyword).trim();
  if (!k) return false;
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(k)}`).test(normalisedText);
}

/** `evidence` is the learner's own sentence that covered the point. */
export type PointResult = { point: string; covered: boolean; matched?: string; evidence?: string };

/** The answer split into sentences, for quoting the learner's own words back. */
export const sentences = (answer: string): string[] =>
  answer
    .split(/(?<=[.!?])\s+|\n+/)
    .map((x) => x.trim())
    .filter(Boolean);

export function coverage(answer: string, rubric: readonly RubricPoint[]): PointResult[] {
  const text = normalise(answer);
  const parts = sentences(answer);
  return rubric.map((r) => {
    const matched = r.keywords.find((k) => findKeyword(text, k));
    if (!matched) return { point: r.point, covered: false };
    const evidence = parts.find((x) => findKeyword(normalise(x), matched));
    return { point: r.point, covered: true, matched, ...(evidence ? { evidence: clipWords(evidence, 40) } : {}) };
  });
}

const clipWords = (text: string, n: number): string => {
  const words = text.split(/\s+/);
  return words.length > n ? `${words.slice(0, n).join(" ")}…` : text;
};

// ---------------------------------------------------- closeness to the reference --

const STOPWORDS = new Set(
  (
    "a about above after again against all also am an and any are as at be because been before being below between both but by can could did do does doing " +
    "down during each few for from further had has have having he her here hers him his how i if in into is it its itself just let me more most my no nor not " +
    "now of off on once one only or other our ours out over own same she should so some such than that the their theirs them then there these they this those " +
    "through to too under until up very was we were what when where which while who whom why will with would you your yours use used using uses get gets make " +
    "makes like way ways thing things much many well need needs want want s t don doesn isn aren"
  ).split(" "),
);

/** A crude stem, so "retrieves", "retrieved" and "retrieval" meet at "retriev". */
export const stem = (word: string): string => word.replace(/(ations?|ingly|edly|ings?|ed|ies|es|s|ly|al)$/, "").slice(0, 7);

/** Content words of a text, stemmed, with the first form seen for each. */
export function contentTerms(text: string): Map<string, { word: string; count: number }> {
  const out = new Map<string, { word: string; count: number }>();
  for (const w of normalise(text).trim().split(" ")) {
    const clean = w.replace(/'s$/, "").replace(/'/g, "");
    if (clean.length < 3 || STOPWORDS.has(clean) || /^\d+$/.test(clean)) continue;
    const key = stem(clean);
    const seen = out.get(key);
    if (seen) seen.count += 1;
    else out.set(key, { word: clean, count: 1 });
  }
  return out;
}

export type ReferenceMatch = {
  /** Share of the reference's key terms the answer used, 0 to 1. */
  score: number;
  matched: string[];
  missed: string[];
};

/**
 * How close an answer is to the reference answer: the reference's most important
 * terms (frequent ones first, at most 15), and which of them the answer used.
 * Words from the question itself are left out, so repeating it earns nothing.
 */
export function referenceMatch(answer: string, reference: string, question = ""): ReferenceMatch {
  const asked = contentTerms(question);
  const ref = [...contentTerms(reference).entries()]
    .filter(([k]) => !asked.has(k))
    .sort((a, b) => b[1].count - a[1].count || b[1].word.length - a[1].word.length)
    .slice(0, 15);
  if (ref.length === 0) return { score: 0, matched: [], missed: [] };
  const said = contentTerms(answer);
  const matched = ref.filter(([k]) => said.has(k)).map(([, v]) => v.word);
  const missed = ref.filter(([k]) => !said.has(k)).map(([, v]) => v.word);
  return { score: matched.length / ref.length, matched, missed };
}

// --------------------------------------------------------------- structure --

export type Structure = { definition: boolean; example: boolean; tradeoff: boolean; practice: boolean };

const has = (text: string, phrases: readonly string[]) => phrases.some((p) => findKeyword(text, p));

/** What an interviewer listens for besides the facts: a clear definition, an example, a trade-off, real use. */
export function structure(answer: string): Structure {
  const text = normalise(answer);
  const first = normalise(sentences(answer)[0] ?? "");
  return {
    definition: has(first, [" is ", " are ", "means", "refers to", "is when", "stands for", "is a way"]) || / (is|are|means) /.test(first),
    example: has(text, ["for example", "for instance", "e g", "such as", "say you", "imagine", "like when", "suppose", "in my project", "we had"]),
    tradeoff: has(text, ["but", "however", "trade off", "tradeoff", "downside", "whereas", "on the other hand", "instead", "cost", "risk", "depends"]),
    practice: has(text, ["in production", "i built", "i used", "we used", "in practice", "at work", "our team", "i would", "we would", "measure", "test"]),
  };
}

// ----------------------------------------------------------- understanding --

export type Band = "strong" | "good" | "partial" | "weak" | "none";
export const BAND_LABEL: Record<Band, string> = {
  strong: "Strong understanding",
  good: "Good, with gaps",
  partial: "Partial understanding",
  weak: "Needs work",
  none: "Not answered",
};

export function bandOf(understanding: number, answered: boolean): Band {
  if (!answered) return "none";
  if (understanding >= 80) return "strong";
  if (understanding >= 60) return "good";
  if (understanding >= 35) return "partial";
  return "weak";
}

/** Single-word fillers, and phrases that are fillers only as a whole. */
const FILLER_WORDS = ["um", "umm", "uh", "uhh", "er", "erm", "hmm", "basically", "actually", "literally"];
const FILLER_PHRASES = ["you know", "i mean", "sort of", "kind of"];

export function countFillers(answer: string): { total: number; top: { word: string; count: number }[] } {
  const text = normalise(answer);
  const counts = new Map<string, number>();
  for (const w of [...FILLER_WORDS, ...FILLER_PHRASES]) {
    const n = text.split(` ${w} `).length - 1;
    if (n > 0) counts.set(w, n);
  }
  const top = [...counts.entries()].map(([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count);
  return { total: top.reduce((s, f) => s + f.count, 0), top: top.slice(0, 3) };
}

export const wordCount = (answer: string): number => normalise(answer).trim().split(" ").filter(Boolean).length;

/** Comfortable interview pace in words per minute; outside this range the report says so. */
export const PACE = { slow: 100, fast: 170 } as const;

export type Delivery = {
  words: number;
  secondsUsed: number;
  limitSeconds: number;
  /** Null when the answer is too short to judge pace. */
  wordsPerMinute: number | null;
  fillers: ReturnType<typeof countFillers>;
  length: "empty" | "short" | "good" | "ran-out";
};

export function delivery(answer: string, secondsUsed: number, limitSeconds: number): Delivery {
  const words = wordCount(answer);
  const used = Math.max(0, Math.min(secondsUsed, limitSeconds));
  const wordsPerMinute = words >= 20 && used >= 10 ? Math.round((words / used) * 60) : null;
  let length: Delivery["length"] = "good";
  if (words === 0) length = "empty";
  else if (used >= limitSeconds) length = "ran-out";
  else if (words < 40 || used < limitSeconds * 0.3) length = "short";
  return { words, secondsUsed: used, limitSeconds, wordsPerMinute, fillers: countFillers(answer), length };
}

export type AnswerResult = {
  questionId: string;
  points: PointResult[];
  covered: number;
  /** 0 to 5, from the share of key points covered. */
  score: number;
  /** How close the answer is to the reference answer. */
  reference: ReferenceMatch;
  structure: Structure;
  /**
   * 0 to 100: key points covered (70%), closeness to the reference (20%) and
   * structure (10%). A word-matching estimate; the AI analysis judges correctness.
   */
  understanding: number;
  band: Band;
  delivery: Delivery;
};

export function analyseAnswer(q: SimQuestion, answer: string, secondsUsed: number): AnswerResult {
  const points = coverage(answer, q.rubric);
  const covered = points.filter((p) => p.covered).length;
  const d = delivery(answer, secondsUsed, q.answer_seconds);
  const answered = d.length !== "empty";
  const reference = answered ? referenceMatch(answer, `${q.short_answer} ${q.deeper_answer ?? ""}`, q.question) : { score: 0, matched: [], missed: [] };
  const shape = structure(answer);
  const shapeScore = [shape.definition, shape.example, shape.tradeoff, shape.practice].filter(Boolean).length / 4;
  const understanding = answered ? Math.round(70 * (covered / q.rubric.length) + 20 * reference.score + 10 * shapeScore) : 0;
  return {
    questionId: q.id,
    points,
    covered,
    score: Math.round((covered / q.rubric.length) * 5),
    reference,
    structure: shape,
    understanding,
    band: bandOf(understanding, answered),
    delivery: d,
  };
}

export type Fix = { kind: "content" | "delivery"; text: string; questionId?: string };

/** How well the learner knows one topic, across the session's questions on it. */
export type Concept = {
  topic: string;
  understanding: number;
  band: Band;
  questions: number;
  /** Lessons to revisit, weakest answer first. */
  lessons: { id: string; title: string }[];
};

export type SessionReport = {
  answered: number;
  /** Average understanding across all questions, 0 to 100. */
  understanding: number;
  band: Band;
  /** Topics, strongest first. */
  concepts: Concept[];
  /** Average score out of 5, to one decimal place. */
  averageScore: number;
  coveredPoints: number;
  totalPoints: number;
  /** Words per minute across answers long enough to judge, or null. */
  pace: number | null;
  fillersPerMinute: number;
  /** The three things most worth fixing first. */
  fixes: Fix[];
};

export function sessionReport(questions: readonly SimQuestion[], results: readonly AnswerResult[]): SessionReport {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const coveredPoints = results.reduce((s, r) => s + r.covered, 0);
  const totalPoints = results.reduce((s, r) => s + r.points.length, 0);
  const paced = results.filter((r) => r.delivery.wordsPerMinute !== null);
  const pacedWords = paced.reduce((s, r) => s + r.delivery.words, 0);
  const pacedSeconds = paced.reduce((s, r) => s + r.delivery.secondsUsed, 0);
  const pace = pacedSeconds > 0 ? Math.round((pacedWords / pacedSeconds) * 60) : null;
  const allSeconds = results.reduce((s, r) => s + r.delivery.secondsUsed, 0);
  const fillers = results.reduce((s, r) => s + r.delivery.fillers.total, 0);
  const fillersPerMinute = allSeconds > 0 ? Math.round((fillers / allSeconds) * 60 * 10) / 10 : 0;

  const fixes: Fix[] = [];
  const empty = results.filter((r) => r.delivery.length === "empty").length;
  if (empty > 0) fixes.push({ kind: "delivery", text: `Answer every question, even briefly: ${empty} had no answer.` });
  // The weakest answers first: each one's first missed point is the content fix.
  const weakest = [...results].filter((r) => r.delivery.length !== "empty").sort((a, b) => a.score - b.score);
  for (const r of weakest) {
    const missed = r.points.find((p) => !p.covered);
    if (missed && r.score < 4) {
      const q = byId.get(r.questionId);
      fixes.push({ kind: "content", questionId: r.questionId, text: `${q ? `On "${q.question}": ` : ""}${missed.point}.` });
    }
  }
  const short = results.filter((r) => r.delivery.length === "short").length;
  if (short > 0) fixes.push({ kind: "delivery", text: `Give fuller answers: ${short} ended well before the time. Add an example or a trade-off.` });
  const ranOut = results.filter((r) => r.delivery.length === "ran-out").length;
  if (ranOut > 0) fixes.push({ kind: "delivery", text: `Lead with the main point: ${ranOut} ran out of time before finishing.` });
  if (pace !== null && pace > PACE.fast) fixes.push({ kind: "delivery", text: `Slow down a little: about ${pace} words a minute is fast for an interview.` });
  if (pace !== null && pace < PACE.slow) fixes.push({ kind: "delivery", text: `Speak a little more fluently: about ${pace} words a minute suggests long pauses.` });
  if (fillersPerMinute >= 4) fixes.push({ kind: "delivery", text: `Cut filler words: about ${fillersPerMinute} a minute. Pause silently instead.` });

  // Content first, but keep at least one delivery note when there is one.
  const content = fixes.filter((f) => f.kind === "content");
  const deliveryFixes = fixes.filter((f) => f.kind === "delivery");
  const top = [...deliveryFixes.slice(0, 1), ...content, ...deliveryFixes.slice(1)].slice(0, 3);

  const concepts = conceptsOf(questions, results);
  const understanding = results.length ? Math.round(results.reduce((s, r) => s + r.understanding, 0) / results.length) : 0;
  const answeredCount = results.filter((r) => r.delivery.length !== "empty").length;

  return {
    answered: answeredCount,
    understanding,
    band: bandOf(understanding, answeredCount > 0),
    concepts,
    averageScore: results.length ? Math.round((results.reduce((s, r) => s + r.score, 0) / results.length) * 10) / 10 : 0,
    coveredPoints,
    totalPoints,
    pace,
    fillersPerMinute,
    fixes: top,
  };
}

function conceptsOf(questions: readonly SimQuestion[], results: readonly AnswerResult[]): Concept[] {
  const byTopic = new Map<string, { q: SimQuestion; r: AnswerResult }[]>();
  questions.forEach((q, i) => {
    const r = results[i];
    if (r) byTopic.set(q.topic, [...(byTopic.get(q.topic) ?? []), { q, r }]);
  });
  return [...byTopic.entries()]
    .map(([topic, items]) => {
      const understanding = Math.round(items.reduce((s, x) => s + x.r.understanding, 0) / items.length);
      const lessons = [...items]
        .sort((a, b) => a.r.understanding - b.r.understanding)
        .map((x) => x.q.stop)
        .filter((st, i, all) => all.findIndex((o) => o.id === st.id) === i);
      return { topic, understanding, band: bandOf(understanding, items.some((x) => x.r.delivery.length !== "empty")), questions: items.length, lessons };
    })
    .sort((a, b) => b.understanding - a.understanding);
}

/**
 * Picks questions for a session: from the path when one is given, spread across
 * topics, in a shuffled order from the seed so a retake gets new questions.
 */
export function pickQuestions(
  all: readonly SimQuestion[],
  opts: { pathId: string | null; count: number; seed: number },
): SimQuestion[] {
  const pool = opts.pathId ? all.filter((q) => q.paths.includes(opts.pathId!)) : [...all];
  const shuffled = shuffle(pool, opts.seed);
  const byTopic = new Map<string, SimQuestion[]>();
  for (const q of shuffled) byTopic.set(q.topic, [...(byTopic.get(q.topic) ?? []), q]);
  // Round-robin across topics so one session covers several.
  const out: SimQuestion[] = [];
  const queues = [...byTopic.values()];
  while (out.length < opts.count && queues.some((qs) => qs.length > 0)) {
    for (const qs of queues) {
      const next = qs.shift();
      if (next && out.length < opts.count) out.push(next);
    }
  }
  return out;
}

/** Deterministic shuffle (mulberry32), so tests and retakes are reproducible from a seed. */
function shuffle<T>(items: readonly T[], seed: number): T[] {
  let a = seed >>> 0;
  const random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
