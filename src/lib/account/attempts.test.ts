import { describe, expect, it } from "vitest";
import { answersContainsFilter, answersToRow, rowToAnswers } from "./attempts";

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

describe("the saved-attempt check (QA-5)", () => {
  const row = answersToRow([
    { questionId: "q1", level: "B3", topicTags: ["git"], choice: "a", correct: true },
    { questionId: "q2", level: "B3", topicTags: ["git"], choice: null, correct: false },
  ]);

  it("sends real JSON, never the text [object Object] that made the check fail and saved duplicates", () => {
    const filter = answersContainsFilter(row);
    expect(filter).not.toContain("[object Object]");
    expect(JSON.parse(filter)).toEqual(row);
    expect(filter.startsWith("[{")).toBe(true);
  });
});
