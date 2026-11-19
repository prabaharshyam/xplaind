import { describe, expect, it } from "vitest";
import { activeDays, badgesOf, streakOf } from "@/lib/game/xp";
import { mergeDays, parseVisits } from "./visits";

const empty = { stops: {}, ratings: {}, interviews: [] };

describe("visit days (ST-1)", () => {
  it("merges old and new days: valid dates only, no repeats, oldest first", () => {
    expect(mergeDays(["2026-11-17", "nonsense", 5], ["2026-11-16", "2026-11-17", "2026-11-18"])).toEqual(["2026-11-16", "2026-11-17", "2026-11-18"]);
  });

  it("keeps only the latest 400 days", () => {
    const many = Array.from({ length: 450 }, (_, i) => new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10));
    const out = mergeDays(many, []);
    expect(out).toHaveLength(400);
    expect(out.at(-1)).toBe(many.at(-1));
  });

  it("reads a stored list and ignores anything damaged", () => {
    expect(parseVisits(JSON.stringify({ version: 1, days: ["2026-11-18", "bad"] }))).toEqual(["2026-11-18"]);
    expect(parseVisits("{")).toEqual([]);
    expect(parseVisits(JSON.stringify({ version: 2, days: ["2026-11-18"] }))).toEqual([]);
    expect(parseVisits(null)).toEqual([]);
  });
});

describe("the day streak counts coming back (ST-1)", () => {
  it("was 0 or 1 for a learner who only opened the site; now every day in a row counts", () => {
    const visits = ["2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17", "2026-11-18"];
    expect(streakOf(activeDays(empty), "2026-11-18")).toBe(0);
    expect(streakOf(activeDays({ ...empty, visits }), "2026-11-18")).toBe(5);
  });

  it("still holds until the day is over, then breaks after a missed day", () => {
    const visits = ["2026-11-15", "2026-11-16", "2026-11-17"];
    expect(streakOf(activeDays({ ...empty, visits }), "2026-11-18")).toBe(3); // today not visited yet
    expect(streakOf(activeDays({ ...empty, visits }), "2026-11-19")).toBe(0); // a whole day missed
  });

  it("mixes visits with finished lessons without counting a day twice", () => {
    const inputs = { stops: { a: { status: "done" as const, how: "check" as const, score: 100, updatedOn: "2026-11-17" } }, ratings: {}, interviews: [], visits: ["2026-11-17", "2026-11-18"] };
    expect(streakOf(activeDays(inputs), "2026-11-18")).toBe(2);
  });

  it("earns the three-day and seven-day badges from coming back", () => {
    const visits = Array.from({ length: 7 }, (_, i) => `2026-11-${String(12 + i).padStart(2, "0")}`);
    const earned = badgesOf({ ...empty, visits }, "2026-11-18").filter((b) => b.earned).map((b) => b.id);
    expect(earned).toEqual(expect.arrayContaining(["three-days", "week-streak"]));
  });
});
