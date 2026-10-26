// MB-3: scores an "Ask me from my book" test and says where the learner is strong and
// what to reread. Pure, so it runs in the browser and in tests.

export type Difficulty = "easy" | "medium" | "hard";
export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: "Easy: recall", medium: "Medium: understanding", hard: "Hard: apply and compare" };

/** One question as the model wrote it, checked against the excerpt it came from. */
export type BookQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  /** Words copied exactly from the book, so the learner can find the place. */
  quote: string;
  page: number;
  section: string;
};

export type BookTest = {
  id: string;
  createdOn: string;
  book: string;
  difficulty: Difficulty;
  minutes: number;
  questions: BookQuestion[];
  /** Set once the learner submits. Index of the chosen option, or null when skipped. */
  result?: { answers: (number | null)[]; seconds: number; finishedOn: string };
};

export type TopicScore = { section: string; right: number; total: number; percent: number; pages: number[] };
export type BookReport = {
  right: number;
  total: number;
  percent: number;
  answered: number;
  seconds: number;
  topics: TopicScore[];
  strong: TopicScore[];
  focus: TopicScore[];
  verdict: string;
};

/** A section is a strength at 80% or more with two or more questions, and needs work under 60%. */
export const STRONG = 80;
export const FOCUS = 60;

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export function bookReport(test: Pick<BookTest, "questions">, answers: readonly (number | null)[], seconds: number): BookReport {
  const by = new Map<string, TopicScore>();
  let right = 0;
  test.questions.forEach((q, i) => {
    const t = by.get(q.section) ?? { section: q.section, right: 0, total: 0, percent: 0, pages: [] };
    t.total++;
    if (answers[i] === q.answer) {
      t.right++;
      right++;
    } else if (!t.pages.includes(q.page)) t.pages.push(q.page);
    by.set(q.section, t);
  });
  const topics = [...by.values()].map((t) => ({ ...t, percent: pct(t.right, t.total), pages: t.pages.sort((a, b) => a - b) }));
  const total = test.questions.length;
  const percent = pct(right, total);
  const strong = topics.filter((t) => t.percent >= STRONG && (t.total >= 2 || topics.length === 1)).sort((a, b) => b.percent - a.percent || b.total - a.total);
  const focus = topics.filter((t) => t.percent < FOCUS).sort((a, b) => a.percent - b.percent || b.total - a.total);
  const verdict =
    percent >= 85
      ? "You know this book well. Try a harder test next."
      : percent >= 65
        ? "A solid grasp, with a few gaps to close."
        : percent >= 40
          ? "You have the basics. Reread the sections below, then test yourself again."
          : "This part of the book has not sunk in yet. Reread it slowly, then take an easier test.";
  return { right, total, percent, answered: answers.filter((a) => a !== null).length, seconds, topics, strong, focus, verdict };
}

/** "pp. 12, 14–16" for a reread list. */
export function pageList(pages: readonly number[]): string {
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const runs: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    runs.push(i === j ? `${sorted[i]}` : `${sorted[i]}–${sorted[j]}`);
    i = j;
  }
  return runs.length === 0 ? "" : `${sorted.length === 1 ? "p." : "pp."} ${runs.join(", ")}`;
}

export const formatSeconds = (s: number) => `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`;
