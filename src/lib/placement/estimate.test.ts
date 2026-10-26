import { describe, expect, it } from "vitest";
import { hoursFromLevel, weeksAtPace } from "./estimate";

const levels = [
  { id: "B1", draft_hours: 8 },
  { id: "B2", draft_hours: 25 },
  { id: "B3", draft_hours: 20 },
  { id: "I1", draft_hours: 20 },
  { id: "I2", draft_hours: 30 },
  { id: "I3", draft_hours: 30 },
  { id: "P1", draft_hours: 25 },
  { id: "P2", draft_hours: 30 },
  { id: "P3", draft_hours: 25 },
] as const;

describe("time estimate", () => {
  it("adds draft hours from the start level to P3", () => {
    expect(hoursFromLevel(levels, "B1")).toBe(213); // PRD: about 213 hours
    expect(hoursFromLevel(levels, "I1")).toBe(160);
    expect(hoursFromLevel(levels, "P3")).toBe(25);
  });
  it("rounds weeks up", () => {
    expect(weeksAtPace(213, 5)).toBe(43); // PRD: roughly 43 weeks at 5 hours a week
    expect(weeksAtPace(25, 10)).toBe(3);
    expect(weeksAtPace(20, 20)).toBe(1);
  });
  it("rejects a pace of zero", () => {
    expect(() => weeksAtPace(10, 0)).toThrow(RangeError);
  });
});
