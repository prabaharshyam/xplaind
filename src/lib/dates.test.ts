import { describe, expect, it } from "vitest";
import { daysBetween, todayInIST } from "./dates";

describe("todayInIST", () => {
  it("rolls over to the next day at 18:30 UTC (midnight in India)", () => {
    expect(todayInIST(new Date("2026-10-25T18:29:00Z"))).toBe("2026-10-25");
    expect(todayInIST(new Date("2026-10-25T18:30:00Z"))).toBe("2026-10-26");
  });
});

describe("daysBetween", () => {
  it("counts whole days, forwards and backwards", () => {
    expect(daysBetween("2026-08-26", "2026-10-25")).toBe(60);
    expect(daysBetween("2026-10-25", "2026-10-25")).toBe(0);
    expect(daysBetween("2026-10-25", "2026-10-24")).toBe(-1);
  });
  it("is not thrown off by a daylight-saving change in other zones", () => {
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2);
  });
});
