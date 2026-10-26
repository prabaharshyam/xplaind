import { describe, expect, it } from "vitest";
import { LEVEL_IDS, type LevelId } from "@/lib/levels";
import { MAX_GAPS, findGaps, hasPassed, scoreAnswers } from "./score";
import type { Answer } from "./types";

let n = 0;
/** Build an answer. `ok` true = correct, false = wrong, null = "I don't know". */
const ans = (level: LevelId, ok: boolean | null, tags: string[] = [`${level}-tag`]): Answer => ({
  questionId: `q${++n}`,
  level,
  topicTags: tags,
  choice: ok === null ? null : ok ? "a" : "b",
  correct: ok === true,
});
const run = (level: LevelId, marks: (boolean | null)[], tags?: string[]) => marks.map((m) => ans(level, m, tags));

describe("PL-3 placement", () => {
  it("a learner who passes every level has passed P3 and stays at the top of the ladder", () => {
    const answers = LEVEL_IDS.flatMap((l) => run(l, [true, true]));
    const r = scoreAnswers(answers);
    expect(r.passedLevel).toBe("P3");
    expect(r.startLevel).toBe("P3");
    expect(r.topOfLadder).toBe(true);
  });

  it("a learner who misses everything starts at B1 with no level passed", () => {
    const r = scoreAnswers(LEVEL_IDS.flatMap((l) => run(l, [false, false])));
    expect(r.passedLevel).toBeNull();
    expect(r.startLevel).toBe("B1");
    expect(r.topOfLadder).toBe(false);
  });

  it("starts at the level after the highest level passed", () => {
    const r = scoreAnswers([...run("B3", [true, true]), ...run("I1", [true, true, false])]);
    expect(r.passedLevel).toBe("I1"); // 2 of 3 is exactly two thirds
    expect(r.startLevel).toBe("I2");
  });

  it("treats exactly two thirds as a pass (a tie goes to the learner)", () => {
    expect(hasPassed({ attempts: 3, correct: 2 })).toBe(true);
    expect(hasPassed({ attempts: 6, correct: 4 })).toBe(true);
    expect(hasPassed({ attempts: 3, correct: 1 })).toBe(false);
  });

  it("does not pass 50 percent", () => {
    expect(hasPassed({ attempts: 4, correct: 2 })).toBe(false);
    expect(scoreAnswers(run("B3", [true, false, true, false])).passedLevel).toBeNull();
  });

  it("ignores a lucky guess at a high level: one answer is not enough to pass", () => {
    const r = scoreAnswers([...run("B3", [true, true]), ...run("P3", [true])]);
    expect(r.passedLevel).toBe("B3");
    expect(r.startLevel).toBe("I1");
  });

  it("needs two answers at a level even if both are right, and one is not enough", () => {
    expect(hasPassed({ attempts: 1, correct: 1 })).toBe(false);
    expect(hasPassed({ attempts: 2, correct: 2 })).toBe(true);
    expect(hasPassed({ attempts: 2, correct: 1 })).toBe(false);
  });

  it("uses the highest passed level even when a lower level was failed", () => {
    const r = scoreAnswers([...run("B3", [false, false, true]), ...run("I2", [true, true])]);
    expect(r.passedLevel).toBe("I2");
    expect(r.startLevel).toBe("I3");
  });

  it("counts \"I don't know\" as an attempt that is wrong", () => {
    const r = scoreAnswers(run("B3", [null, null, null]));
    expect(r.perLevel.B3).toEqual({ attempts: 3, correct: 0 });
    expect(r.passedLevel).toBeNull();
    expect(r.startLevel).toBe("B1");
  });

  it("handles an empty attempt", () => {
    const r = scoreAnswers([]);
    expect(r).toMatchObject({ passedLevel: null, startLevel: "B1", gaps: [], questionsAnswered: 0 });
  });

  it("tallies answers per level", () => {
    const r = scoreAnswers([...run("B3", [true, false]), ...run("I1", [false])]);
    expect(r.perLevel.B3).toEqual({ attempts: 2, correct: 1 });
    expect(r.perLevel.I1).toEqual({ attempts: 1, correct: 0 });
    expect(r.perLevel.P3).toEqual({ attempts: 0, correct: 0 });
  });
});

describe("PL-4 gaps", () => {
  it("takes tags from wrong and \"I don't know\" answers only", () => {
    const answers = [ans("B1", false, ["alpha"]), ans("B1", null, ["beta"]), ans("B1", true, ["gamma"])];
    expect(findGaps(answers, "B2")).toEqual(["alpha", "beta"]);
  });

  it("ignores answers above the start level", () => {
    const answers = [ans("B1", false, ["low"]), ans("B2", false, ["at-start"]), ans("B3", false, ["above"])];
    expect(findGaps(answers, "B2")).toEqual(["low", "at-start"]);
  });

  it("shows at most three, most frequent first", () => {
    const answers = [
      ans("B1", false, ["a"]),
      ans("B1", false, ["b"]),
      ans("B1", false, ["b"]),
      ans("B1", false, ["c"]),
      ans("B1", false, ["c"]),
      ans("B1", false, ["c"]),
      ans("B1", false, ["d"]),
    ];
    expect(findGaps(answers, "B3")).toEqual(["c", "b", "a"]);
    expect(findGaps(answers, "B3")).toHaveLength(MAX_GAPS);
  });

  it("breaks a tie by the lowest level first, then alphabetically", () => {
    const answers = [ans("B2", false, ["zeta"]), ans("B1", false, ["yank"]), ans("B1", false, ["xray"])];
    expect(findGaps(answers, "B3")).toEqual(["xray", "yank", "zeta"]);
  });

  it("counts every tag on a question", () => {
    const answers = [ans("B1", false, ["a", "b"]), ans("B1", false, ["b"])];
    expect(findGaps(answers, "B2")).toEqual(["b", "a"]);
  });

  it("returns no gaps when everything is right", () => {
    expect(scoreAnswers(run("B3", [true, true, true])).gaps).toEqual([]);
  });

  it("is part of the result and obeys the start level", () => {
    // passes B3, so start is I1; the I1 miss (at start level) counts, the I2 miss does not
    const r = scoreAnswers([...run("B3", [true, true]), ans("I1", false, ["at-start"]), ans("I2", false, ["above"])]);
    expect(r.startLevel).toBe("I1");
    expect(r.gaps).toEqual(["at-start"]);
  });
});
