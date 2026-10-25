import { describe, expect, it } from "vitest";
import { LEVEL_IDS, type LevelId } from "@/lib/levels";
import {
  FIRST_LEVEL,
  InvalidAttemptError,
  TEST_LENGTH,
  currentQuestion,
  gradeChoices,
  isValidStaircase,
  resultOf,
  seededRng,
  startTest,
  submitAnswer,
} from "./select";
import type { BankQuestion, TestState } from "./types";

function makeBank(perLevel: number): BankQuestion[] {
  return LEVEL_IDS.flatMap((level) =>
    Array.from({ length: perLevel }, (_, i) => ({
      id: `${level.toLowerCase()}-${i + 1}`,
      level,
      topic_tags: [`tag-${level.toLowerCase()}`],
      options: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }],
      correct: "a",
    })),
  );
}

type Policy = (level: LevelId, step: number) => "right" | "wrong" | "idk";

function simulate(bank: BankQuestion[], policy: Policy, seed = 1) {
  const rng = seededRng(seed);
  let state: TestState = startTest(bank, rng);
  const levels: LevelId[] = [];
  while (!state.done) {
    const q = currentQuestion(state, bank)!;
    levels.push(q.level);
    const verdict = policy(q.level, levels.length);
    state = submitAnswer(state, bank, verdict === "right" ? q.correct : verdict === "wrong" ? "b" : null, rng);
  }
  return { state, levels };
}

describe("PL-2 staircase", () => {
  const bank = makeBank(6);

  it("starts at B3", () => {
    const state = startTest(bank, seededRng(7));
    expect(state.level).toBe(FIRST_LEVEL);
    expect(currentQuestion(state, bank)?.level).toBe("B3");
    expect(state.done).toBe(false);
  });

  it("moves up after a correct answer and down after a wrong answer or \"I don't know\"", () => {
    const rng = seededRng(3);
    let s = startTest(bank, rng);
    s = submitAnswer(s, bank, "a", rng); // B3 right -> I1
    expect(currentQuestion(s, bank)?.level).toBe("I1");
    s = submitAnswer(s, bank, "b", rng); // I1 wrong -> B3
    expect(currentQuestion(s, bank)?.level).toBe("B3");
    s = submitAnswer(s, bank, null, rng); // B3 idk -> B2
    expect(currentQuestion(s, bank)?.level).toBe("B2");
  });

  it("an all-correct run ends at P3 after 12 questions", () => {
    const { state, levels } = simulate(bank, () => "right");
    expect(state.answers).toHaveLength(TEST_LENGTH);
    expect(state.level).toBe("P3");
    expect(levels.slice(0, 8)).toEqual(["B3", "I1", "I2", "I3", "P1", "P2", "P3", "P3"]);
    expect(resultOf(state)).toMatchObject({ passedLevel: "P3", startLevel: "P3", topOfLadder: true });
  });

  it("an all-wrong run ends at B1 and places the learner at B1", () => {
    const { state, levels } = simulate(makeBank(12), () => "wrong");
    expect(state.answers).toHaveLength(TEST_LENGTH);
    expect(state.level).toBe("B1");
    expect(levels.slice(0, 4)).toEqual(["B3", "B2", "B1", "B1"]);
    expect(resultOf(state)).toMatchObject({ passedLevel: null, startLevel: "B1" });
  });

  it("an all \"I don't know\" run behaves like all wrong", () => {
    const { state } = simulate(makeBank(12), () => "idk");
    expect(state.level).toBe("B1");
    expect(resultOf(state).startLevel).toBe("B1");
  });

  it("ends early when no unseen question is left at the level reached", () => {
    const { state } = simulate(makeBank(6), () => "wrong"); // B3,B2, then six at B1 -> pool empty
    expect(state.answers).toHaveLength(8);
    expect(state.done).toBe(true);
    expect(state.currentId).toBeNull();
  });

  it("never asks the same question twice, for many seeds and learner patterns", () => {
    const patterns: Policy[] = [
      () => "right",
      () => "wrong",
      (_l, step) => (step % 2 ? "right" : "wrong"),
      (_l, step) => (step % 3 === 0 ? "wrong" : "right"),
      (l) => (l <= "I1" ? "right" : "wrong"),
    ];
    for (const policy of patterns) {
      for (let seed = 1; seed <= 40; seed++) {
        const { state } = simulate(makeBank(6), policy, seed);
        const ids = state.answers.map((a) => a.questionId);
        expect(new Set(ids).size).toBe(ids.length);
        expect(state.answers.length).toBeLessThanOrEqual(TEST_LENGTH);
        expect(isValidStaircase(state.answers)).toBe(true);
      }
    }
  });

  it("stays within B1 and P3", () => {
    const { levels } = simulate(makeBank(12), (_l, step) => (step < 3 ? "wrong" : "right"));
    expect(levels.every((l) => LEVEL_IDS.includes(l))).toBe(true);
  });

  it("gives the same questions for the same seed, and different ones for another", () => {
    const a = simulate(bank, () => "right", 5).state.answers.map((x) => x.questionId);
    const b = simulate(bank, () => "right", 5).state.answers.map((x) => x.questionId);
    const c = simulate(bank, () => "right", 6).state.answers.map((x) => x.questionId);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("does nothing once the test is done", () => {
    const { state } = simulate(bank, () => "right");
    expect(submitAnswer(state, bank, "a", seededRng(1))).toBe(state);
  });

  it("finishes at once when the bank has no B3 question", () => {
    const empty = bank.filter((q) => q.level !== "B3");
    expect(startTest(empty, seededRng(1))).toMatchObject({ done: true, currentId: null });
  });

  it("survives being saved and restored as JSON (a refresh keeps the place)", () => {
    const rng = seededRng(9);
    let s = startTest(bank, rng);
    s = submitAnswer(s, bank, "a", rng);
    const restored = JSON.parse(JSON.stringify(s)) as TestState;
    expect(currentQuestion(restored, bank)?.id).toBe(currentQuestion(s, bank)?.id);
  });
});

describe("gradeChoices (server re-scoring)", () => {
  const bank = makeBank(2);

  it("grades from the bank and ignores any claimed result", () => {
    const answers = gradeChoices(bank, [
      { questionId: "b3-1", choice: "a" },
      { questionId: "i1-1", choice: null },
      { questionId: "b2-1", choice: "c" },
    ]);
    expect(answers.map((a) => a.correct)).toEqual([true, false, false]);
    expect(answers[0].topicTags).toEqual(["tag-b3"]);
  });

  it("rejects an unknown question, a repeat, and an option that does not exist", () => {
    expect(() => gradeChoices(bank, [{ questionId: "nope", choice: "a" }])).toThrow(InvalidAttemptError);
    expect(() =>
      gradeChoices(bank, [
        { questionId: "b3-1", choice: "a" },
        { questionId: "b3-1", choice: "b" },
      ]),
    ).toThrow(/twice/);
    expect(() => gradeChoices(bank, [{ questionId: "b3-1", choice: "z" }])).toThrow(/not an option/);
  });
});

describe("isValidStaircase", () => {
  const bank = makeBank(6);
  const good = simulate(bank, (_l, step) => (step % 2 ? "right" : "wrong")).state.answers;

  it("accepts a real run", () => {
    expect(isValidStaircase(good)).toBe(true);
    expect(isValidStaircase([])).toBe(true);
  });

  it("rejects a run that does not start at B3", () => {
    expect(isValidStaircase(good.slice(1))).toBe(false);
  });

  it("rejects a run that skips levels or has more than 12 answers", () => {
    const tampered = good.map((a, i) => (i === 2 ? { ...a, level: "P3" as LevelId } : a));
    expect(isValidStaircase(tampered)).toBe(false);
    expect(isValidStaircase([...good, ...good, ...good])).toBe(false);
  });

  it("rejects a run whose correctness does not match its next level", () => {
    const flipped = good.map((a, i) => (i === 0 ? { ...a, correct: !a.correct } : a));
    expect(isValidStaircase(flipped)).toBe(false);
  });
});
