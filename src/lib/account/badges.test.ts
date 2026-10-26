import { describe, expect, it } from "vitest";
import { earnedLevelBadges } from "./badges";

const stops = [
  { id: "b1-a", level: "B1" as const },
  { id: "b1-b", level: "B1" as const },
  { id: "b2-a", level: "B2" as const },
];
const done = (stop_id: string, done_how: string) => ({ stop_id, status: "done", done_how });

describe("earnedLevelBadges (AC-6)", () => {
  it("gives nothing without a pass", () => {
    expect(earnedLevelBadges({ passedLevels: [null], stops, progress: [] })).toEqual([]);
  });

  it("gives the placement's passed level and every level below it (PL-3)", () => {
    expect(earnedLevelBadges({ passedLevels: ["B3"], stops, progress: [] })).toEqual(["level-B1", "level-B2", "level-B3"]);
  });

  it("uses the best of several attempts", () => {
    expect(earnedLevelBadges({ passedLevels: ["B1", null, "B2"], stops, progress: [] })).toEqual(["level-B1", "level-B2"]);
  });

  it("gives a level when all its stops are done by check or project (RM-7)", () => {
    const progress = [done("b1-a", "check"), done("b1-b", "project")];
    expect(earnedLevelBadges({ passedLevels: [], stops, progress })).toEqual(["level-B1"]);
  });

  it("does not count self-skipped stops or stops in progress", () => {
    expect(earnedLevelBadges({ passedLevels: [], stops, progress: [done("b1-a", "check"), done("b1-b", "self_skipped")] })).toEqual([]);
    expect(
      earnedLevelBadges({ passedLevels: [], stops, progress: [done("b1-a", "check"), { stop_id: "b1-b", status: "in_progress", done_how: null }] }),
    ).toEqual([]);
  });

  it("never gives a badge for a level with no stops by the RM-7 route", () => {
    expect(earnedLevelBadges({ passedLevels: [], stops: [], progress: [] })).toEqual([]);
  });
});
