import { describe, expect, it } from "vitest";
import { weekStart, weeklyStreak } from "./streak";

// 2026-10-26 is a Monday.
describe("weekStart", () => {
  it("returns the Monday of the week", () => {
    expect(weekStart("2026-10-26")).toBe("2026-10-26");
    expect(weekStart("2026-11-01")).toBe("2026-10-26"); // Sunday belongs to the week before
    expect(weekStart("2026-10-28")).toBe("2026-10-26");
    expect(weekStart("2027-01-01")).toBe("2026-12-28"); // across a year
  });
});

describe("weeklyStreak (AC-5)", () => {
  const today = "2026-11-04"; // Wednesday of the week starting 2026-11-02

  it("counts consecutive active weeks up to this week", () => {
    const days = ["2026-11-03", "2026-10-28", "2026-10-21"];
    expect(weeklyStreak(days, today)).toEqual({ current: 3, weeksActive: 3, activeThisWeek: true });
  });

  it("keeps the streak while this week is still empty", () => {
    expect(weeklyStreak(["2026-10-28", "2026-10-21"], today).current).toBe(2);
  });

  it("resets after one full empty week", () => {
    expect(weeklyStreak(["2026-10-21", "2026-10-14"], today).current).toBe(0);
  });

  it("counts several days in one week once", () => {
    expect(weeklyStreak(["2026-11-02", "2026-11-03", "2026-11-04"], today)).toEqual({ current: 1, weeksActive: 1, activeThisWeek: true });
  });

  it("stops at a gap in the past", () => {
    const days = ["2026-11-03", "2026-10-28", "2026-10-14", "2026-10-07"];
    expect(weeklyStreak(days, today)).toMatchObject({ current: 2, weeksActive: 4 });
  });

  it("treats Sunday as the end of the week, not the start", () => {
    // Active only on Sunday 1 Nov; on Monday 2 Nov the streak still stands.
    expect(weeklyStreak(["2026-11-01"], "2026-11-02").current).toBe(1);
    // On Monday 9 Nov a full empty week has passed.
    expect(weeklyStreak(["2026-11-01"], "2026-11-09").current).toBe(0);
  });

  it("is zero with no activity", () => {
    expect(weeklyStreak([], today)).toEqual({ current: 0, weeksActive: 0, activeThisWeek: false });
  });
});
