import { describe, expect, it } from "vitest";
import type { BankQuestion } from "@/lib/placement/types";
import { ClaimBody, InvalidClaimError, activityDays, mergeProgress, mergeRatings, mergeStop, rescoreAttempt } from "./claim";

const T1 = "2026-10-20";
const T2 = "2026-10-25";

describe("ClaimBody", () => {
  const valid = {
    attempt: { goal: "genai-engineer", weeklyHours: 5, completedOn: T2, choices: [{ questionId: "q-b3", choice: "a" }] },
    progress: { "what-is-ai": { status: "done", how: "check", score: 100, updatedOn: T2 } },
    ratings: { "what-is-rag": { rating: 2, updatedOn: T2 } },
  };

  it("accepts a well-formed claim, and one with no attempt", () => {
    expect(ClaimBody.safeParse(valid).success).toBe(true);
    expect(ClaimBody.safeParse({ ...valid, attempt: null }).success).toBe(true);
  });

  it("rejects unknown fields, bad ids and out-of-range values", () => {
    expect(ClaimBody.safeParse({ ...valid, email: "x@y.z" }).success).toBe(false);
    expect(ClaimBody.safeParse({ ...valid, progress: { "../etc": valid.progress["what-is-ai"] } }).success).toBe(false);
    expect(ClaimBody.safeParse({ ...valid, ratings: { a: { rating: 3, updatedOn: T2 } } }).success).toBe(false);
    expect(ClaimBody.safeParse({ ...valid, progress: { a: { status: "done", score: 101, updatedOn: T2 } } }).success).toBe(false);
  });
});

describe("rescoreAttempt", () => {
  const q = (id: string, level: BankQuestion["level"]): BankQuestion => ({
    id,
    level,
    topic_tags: ["t"],
    options: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }],
    correct: "a",
  });
  const bank = [q("q-b3", "B3"), q("q-i1", "I1"), q("q-b2", "B2")];
  const attempt = (choices: { questionId: string; choice: string | null }[]) => ({ goal: "g", weeklyHours: 5, completedOn: T2, choices });

  it("grades on the server, ignoring anything the device says about correctness", () => {
    const { answers, result } = rescoreAttempt(bank, attempt([{ questionId: "q-b3", choice: "a" }, { questionId: "q-i1", choice: "b" }]));
    expect(answers.map((a) => a.correct)).toEqual([true, false]);
    expect(result.questionsAnswered).toBe(2);
  });

  it("rejects a sequence the staircase could not produce", () => {
    // A right answer at B3 must be followed by I1, not B2.
    expect(() => rescoreAttempt(bank, attempt([{ questionId: "q-b3", choice: "a" }, { questionId: "q-b2", choice: "a" }]))).toThrow(InvalidClaimError);
  });

  it("rejects unknown questions and options", () => {
    expect(() => rescoreAttempt(bank, attempt([{ questionId: "nope", choice: "a" }]))).toThrow(InvalidClaimError);
    expect(() => rescoreAttempt(bank, attempt([{ questionId: "q-b3", choice: "z" }]))).toThrow(InvalidClaimError);
  });
});

describe("merging device and server data (AC-2)", () => {
  const inProgress = (on: string) => ({ status: "in_progress" as const, updatedOn: on });
  const done = (on: string) => ({ status: "done" as const, how: "check" as const, score: 100, updatedOn: on });

  it("prefers done over in progress, whichever is newer", () => {
    expect(mergeStop(done(T1), inProgress(T2))).toEqual(done(T1));
    expect(mergeStop(inProgress(T2), done(T1))).toEqual(done(T1));
  });

  it("otherwise keeps the newer record, and the server's on a tie", () => {
    const device = { ...inProgress(T2), score: 33 };
    expect(mergeStop(device, inProgress(T1))).toEqual(device);
    const server = { ...inProgress(T2), score: 50 };
    expect(mergeStop({ ...inProgress(T2), score: 10 }, server)).toEqual(server);
  });

  it("keeps stops that only one side has", () => {
    expect(Object.keys(mergeProgress({ a: done(T1) }, { b: inProgress(T1) })).sort()).toEqual(["a", "b"]);
  });

  it("keeps the newer rating", () => {
    expect(mergeRatings({ q: { rating: 2, updatedOn: T2 } }, { q: { rating: 0, updatedOn: T1 } })).toEqual({ q: { rating: 2, updatedOn: T2 } });
    expect(mergeRatings({ q: { rating: 2, updatedOn: T1 } }, { q: { rating: 0, updatedOn: T2 } })).toEqual({ q: { rating: 0, updatedOn: T2 } });
  });

  it("counts done stops, checks taken and practice ratings as activity days (AC-5)", () => {
    const days = activityDays(
      { a: done("2026-10-21"), b: inProgress("2026-10-22"), c: { ...inProgress("2026-10-23"), score: 33 } },
      { q: { rating: 1, updatedOn: "2026-10-24" } },
    );
    expect(days).toEqual(["2026-10-21", "2026-10-23", "2026-10-24"]);
  });
});
