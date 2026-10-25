import { describe, expect, it } from "vitest";
import { XP, activeDays, badgesOf, rankOf, streakOf, xpOf } from "./xp";

const empty = { stops: {}, ratings: {}, interviews: [] };

describe("xpOf", () => {
  it("adds lessons by how they were finished, practice and interviews", () => {
    const xp = xpOf({
      stops: {
        a: { status: "done", how: "check", score: 100, updatedOn: "2026-10-20" },
        b: { status: "done", how: "project", updatedOn: "2026-10-21" },
        c: { status: "done", how: "self_skipped", updatedOn: "2026-10-21" },
        d: { status: "in_progress", updatedOn: "2026-10-22" },
      },
      ratings: { q1: { rating: 2, updatedOn: "2026-10-22" } },
      interviews: [{ on: "2026-10-23", answered: 3, total: 3, averageScore: 2 }],
    });
    expect(xp).toBe(XP.lessonCheck + XP.perfectCheck + XP.lessonProject + XP.lessonSkipped + XP.practiceRating + 3 * XP.interviewAnswer + 2 * 3 * XP.interviewScorePoint);
  });

  it("is zero with no activity", () => expect(xpOf(empty)).toBe(0));
});

describe("rankOf", () => {
  it("names the rank and the progress to the next one", () => {
    expect(rankOf(0)).toMatchObject({ name: "Curious", next: { name: "Explorer" }, progress: 0 });
    expect(rankOf(200)).toMatchObject({ name: "Explorer", progress: 0.5 });
    expect(rankOf(99999)).toMatchObject({ name: "Master", next: null, progress: 1 });
  });
});

describe("streakOf", () => {
  const days = new Set(["2026-10-23", "2026-10-24", "2026-10-25", "2026-10-20"]);
  it("counts days in a row ending today", () => expect(streakOf(days, "2026-10-25")).toBe(3));
  it("still counts when today has nothing yet", () => expect(streakOf(days, "2026-10-26")).toBe(3));
  it("breaks after a missed day", () => expect(streakOf(days, "2026-10-27")).toBe(0));
  it("crosses month ends", () => expect(streakOf(new Set(["2026-09-30", "2026-10-01"]), "2026-10-01")).toBe(2));
});

describe("badgesOf", () => {
  it("earns badges from activity", () => {
    const inputs = {
      stops: { a: { status: "done" as const, how: "check" as const, score: 100, updatedOn: "2026-10-25" } },
      ratings: {},
      interviews: [{ on: "2026-10-24", answered: 1, total: 1, averageScore: 3 }],
    };
    const earned = badgesOf(inputs, "2026-10-25").filter((b) => b.earned).map((b) => b.id);
    expect(earned).toEqual(["first-step", "perfect", "spoke-up"]);
    expect([...activeDays(inputs)].sort()).toEqual(["2026-10-24", "2026-10-25"]);
  });
});
