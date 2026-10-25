import { describe, expect, it } from "vitest";
import { answersToRow, rowToAnswers } from "./attempts";

const bank = [{ id: "q1", level: "B3" as const, topic_tags: ["git"], options: [{ id: "a" }], correct: "a" }];

describe("attempt rows", () => {
  it("round-trips answers through the PRD row shape", () => {
    const answers = [{ questionId: "q1", level: "B3" as const, topicTags: ["git"], choice: "a", correct: true }];
    const row = answersToRow(answers);
    expect(row).toEqual([{ question_id: "q1", level: "B3", chosen: "a", correct: true }]);
    expect(rowToAnswers(row, bank)).toEqual(answers);
  });

  it("drops answers to questions no longer in the bank", () => {
    expect(rowToAnswers([{ question_id: "gone", level: "B3", chosen: null, correct: false }], bank)).toEqual([]);
  });
});
