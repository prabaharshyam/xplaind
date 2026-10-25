// Question selection (PL-2): a staircase of up to 12 questions that starts at B3,
// moves up one level after a correct answer and down one after a wrong answer or
// "I don't know", and never repeats a question. Pure and serialisable (PL-6).
import { levelDown, levelUp, type LevelId } from "@/lib/levels";
import { scoreAnswers } from "./score";
import type { Answer, BankQuestion, PlacementResult, Rng, TestState } from "./types";

export const TEST_LENGTH = 12;
export const FIRST_LEVEL: LevelId = "B3";

function pickUnseen<Q extends BankQuestion>(
  bank: readonly Q[],
  answered: readonly Answer[],
  level: LevelId,
  rng: Rng,
): Q | null {
  const seen = new Set(answered.map((a) => a.questionId));
  const pool = bank.filter((q) => q.level === level && !seen.has(q.id));
  if (pool.length === 0) return null;
  return pool[Math.min(Math.floor(rng() * pool.length), pool.length - 1)];
}

export function startTest<Q extends BankQuestion>(bank: readonly Q[], rng: Rng): TestState {
  const first = pickUnseen(bank, [], FIRST_LEVEL, rng);
  return { answers: [], level: FIRST_LEVEL, currentId: first?.id ?? null, done: first === null };
}

export function currentQuestion<Q extends BankQuestion>(state: TestState, bank: readonly Q[]): Q | null {
  return state.currentId ? (bank.find((q) => q.id === state.currentId) ?? null) : null;
}

export function gradeAnswer(question: BankQuestion, choice: string | null): Answer {
  return {
    questionId: question.id,
    level: question.level,
    topicTags: [...question.topic_tags],
    choice,
    correct: choice !== null && choice === question.correct,
  };
}

/**
 * Record an answer to the current question and choose the next one. The test ends
 * after TEST_LENGTH answers, or earlier when the bank has no unseen question left at
 * the level the staircase has reached (see docs/decisions.md).
 */
export function submitAnswer<Q extends BankQuestion>(
  state: TestState,
  bank: readonly Q[],
  choice: string | null,
  rng: Rng,
): TestState {
  const question = currentQuestion(state, bank);
  if (state.done || !question) return state;

  const answer = gradeAnswer(question, choice);
  const answers = [...state.answers, answer];
  const level = answer.correct ? levelUp(question.level) : levelDown(question.level);

  if (answers.length >= TEST_LENGTH) return { answers, level, currentId: null, done: true };
  const next = pickUnseen(bank, answers, level, rng);
  return { answers, level, currentId: next?.id ?? null, done: next === null };
}

export function resultOf(state: TestState): PlacementResult {
  return scoreAnswers(state.answers);
}

/** Small seeded generator so tests and simulations are repeatable. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ----------------------------------------------------------- re-checking ---

export type RawChoice = { questionId: string; choice: string | null };

export class InvalidAttemptError extends Error {}

/**
 * Turn raw (question id, choice) pairs into graded answers using the bank. Used by the
 * server to re-score a claimed attempt, so it never trusts a `correct` flag from a client.
 */
export function gradeChoices(bank: readonly BankQuestion[], raw: readonly RawChoice[]): Answer[] {
  const byId = new Map(bank.map((q) => [q.id, q]));
  const seen = new Set<string>();
  return raw.map(({ questionId, choice }) => {
    const q = byId.get(questionId);
    if (!q) throw new InvalidAttemptError(`unknown question "${questionId}"`);
    if (seen.has(questionId)) throw new InvalidAttemptError(`question "${questionId}" appears twice`);
    seen.add(questionId);
    if (choice !== null && !q.options.some((o) => o.id === choice)) {
      throw new InvalidAttemptError(`"${choice}" is not an option of "${questionId}"`);
    }
    return gradeAnswer(q, choice);
  });
}

/**
 * True when the answers could have come from the staircase: at most 12, the first at B3,
 * and each next level one step up after a correct answer or one step down after a miss.
 */
export function isValidStaircase(answers: readonly Answer[]): boolean {
  if (answers.length > TEST_LENGTH) return false;
  let expected: LevelId = FIRST_LEVEL;
  for (const a of answers) {
    if (a.level !== expected) return false;
    expected = a.correct ? levelUp(a.level) : levelDown(a.level);
  }
  return true;
}
