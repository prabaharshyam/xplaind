import { describe, expect, it } from "vitest";
import { readiness, readinessLabel, sessionScore } from "./readiness";

describe("interview readiness (IR-1)", () => {
  it("scores a session as the average answer score out of 100", () => {
    expect(sessionScore([5, 5, 5])).toBe(100);
    expect(sessionScore([3, 2, 4, 3])).toBe(60);
    expect(sessionScore([])).toBeNull();
  });

  it("averages the latest three and compares with the three before", () => {
    expect(readiness([])).toBeNull();
    expect(readiness([60])).toEqual({ score: 60, change: null, sessions: 1 });
    expect(readiness([80, 70, 60, 50, 40, 30])).toEqual({ score: 70, change: 30, sessions: 6 });
    expect(readiness([40, 50, 60, 70])).toEqual({ score: 50, change: -20, sessions: 4 });
  });

  it("names each band", () => {
    expect(readinessLabel(85)).toBe("Interview-ready");
    expect(readinessLabel(65)).toBe("Nearly there");
    expect(readinessLabel(45)).toBe("Getting there");
    expect(readinessLabel(10)).toBe("Just starting");
  });
});

describe("the free view of a review (IR-2)", () => {
  it("keeps the summary and each score and verdict, and drops the detailed feedback", async () => {
    const { freeView } = await import("@/lib/ai/features");
    const full = {
      summary: "Solid basics.",
      strengths: ["Clear"],
      gaps: ["Evals"],
      next_steps: ["Practise"],
      answers: [{ questionId: "q1", score: 4, understanding: "good" as const, verdict: "Good.", correct: ["A"], mistakes: ["B"], missing: ["C"], feedback: "More.", stronger_answer: "Better." }],
    };
    const free = freeView(full);
    expect(free.summary).toBe("Solid basics.");
    expect(free.answers[0]).toMatchObject({ questionId: "q1", score: 4, verdict: "Good.", correct: [], mistakes: [], missing: [], feedback: "", stronger_answer: "" });
  });
});
