// Types for the placement test. Pure data: no database, UI or framework imports (PL-6).
import type { LevelId } from "@/lib/levels";

/** The least a question needs for the engine to run and grade the test. */
export type BankQuestion = {
  id: string;
  level: LevelId;
  topic_tags: readonly string[];
  options: readonly { id: string }[];
  correct: string;
};

/** One graded answer. `choice` is an option id, or null for "I don't know". */
export type Answer = {
  questionId: string;
  level: LevelId;
  topicTags: string[];
  choice: string | null;
  correct: boolean;
};

export type LevelTally = { attempts: number; correct: number };

export type PlacementResult = {
  /** Highest level passed (PL-3), or null when no level was passed. */
  passedLevel: LevelId | null;
  /** Where the learner's roadmap starts. */
  startLevel: LevelId;
  /** True when the learner passed P3, so there is no level above to start at. */
  topOfLadder: boolean;
  perLevel: Record<LevelId, LevelTally>;
  /** Up to three topic tags to review (PL-4). */
  gaps: string[];
  questionsAnswered: number;
};

/** A random number in [0, 1). Math.random in the browser, a seeded one in tests. */
export type Rng = () => number;

/** Serialisable state of a test in progress (safe to keep in the browser). */
export type TestState = {
  answers: Answer[];
  /** Level of the question being shown (or the level reached when the test ended). */
  level: LevelId;
  currentId: string | null;
  done: boolean;
};

/** What the test page needs to show a question. It carries the answer: the test has no stakes (PRD, Architecture). */
export type PublicQuestion = Omit<BankQuestion, "options"> & {
  stem: string;
  explanation: string;
  options: readonly { id: string; text: string }[];
};
