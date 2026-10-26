// VS-1 and the release 3 report, done without a model: checks a spoken or typed
// answer against the question's rubric and measures delivery from the transcript.
// Pure: no DOM, no network, no storage. Release 1 makes no model calls.

export type RubricPoint = { point: string; keywords: readonly string[] };

export type SimQuestion = {
  id: string;
  question: string;
  short_answer: string;
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

export type PointResult = { point: string; covered: boolean; matched?: string };

export function coverage(answer: string, rubric: readonly RubricPoint[]): PointResult[] {
  const text = normalise(answer);
  return rubric.map((r) => {
    const matched = r.keywords.find((k) => findKeyword(text, k));
    return matched ? { point: r.point, covered: true, matched } : { point: r.point, covered: false };
  });
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
  delivery: Delivery;
};

export function analyseAnswer(q: SimQuestion, answer: string, secondsUsed: number): AnswerResult {
  const points = coverage(answer, q.rubric);
  const covered = points.filter((p) => p.covered).length;
  return {
    questionId: q.id,
    points,
    covered,
    score: Math.round((covered / q.rubric.length) * 5),
    delivery: delivery(answer, secondsUsed, q.answer_seconds),
  };
}

export type Fix = { kind: "content" | "delivery"; text: string; questionId?: string };

export type SessionReport = {
  answered: number;
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

  return {
    answered: results.filter((r) => r.delivery.length !== "empty").length,
    averageScore: results.length ? Math.round((results.reduce((s, r) => s + r.score, 0) / results.length) * 10) / 10 : 0,
    coveredPoints,
    totalPoints,
    pace,
    fillersPerMinute,
    fixes: top,
  };
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
