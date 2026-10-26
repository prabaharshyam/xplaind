import { describe, expect, it } from "vitest";
import type { LevelId } from "@/lib/levels";
import { nextSteps, reviewStopFor } from "./next-steps";
import type { RoadmapStop } from "./types";

const stop = (id: string, level: LevelId, gap_tags: string[] = [], hours = 2): RoadmapStop => ({
  id,
  level,
  hours,
  gap_tags,
});

// Two stops per level for B1 to I1, in path order.
const STOPS: RoadmapStop[] = [
  stop("b1-a", "B1", ["ai-basics"]),
  stop("b1-b", "B1", ["prompting"]),
  stop("b2-a", "B2", ["python-basics"]),
  stop("b2-b", "B2", ["python-files"]),
  stop("b3-a", "B3", ["git"]),
  stop("b3-b", "B3", ["pandas"]),
  stop("i1-a", "I1", ["tokens"]),
  stop("i1-b", "I1"),
];
const ids = (steps: { stopId: string }[]) => steps.map((s) => s.stopId);
const none = new Set<string>();

describe("nextSteps (RM-3)", () => {
  it("follows the path's own order, not the level order", () => {
    // A path may teach an I1 lesson before a B3 one, as the FDE path does.
    const path = [stop("i1-a", "I1"), stop("b3-a", "B3"), stop("b1-a", "B1"), stop("i1-b", "I1")];
    expect(ids(nextSteps({ stops: path, startLevel: "B3", gapTags: [], completed: none }))).toEqual(["i1-a", "b3-a", "i1-b"]);
  });

  it("lists five stops from the start level in path order when there are no gaps", () => {
    expect(ids(nextSteps({ stops: STOPS, startLevel: "B2", gapTags: [], completed: none }))).toEqual([
      "b2-a",
      "b2-b",
      "b3-a",
      "b3-b",
      "i1-a",
    ]);
  });

  it("puts up to two review stops for gaps first, in gap order", () => {
    const steps = nextSteps({ stops: STOPS, startLevel: "B3", gapTags: ["prompting", "ai-basics", "python-basics"], completed: none });
    expect(steps.slice(0, 2)).toEqual([
      { stopId: "b1-b", reason: "review", gapTag: "prompting" },
      { stopId: "b1-a", reason: "review", gapTag: "ai-basics" },
    ]);
    expect(ids(steps)).toEqual(["b1-b", "b1-a", "b3-a", "b3-b", "i1-a"]);
  });

  it("does not list a review stop twice when it is also on the path", () => {
    const steps = nextSteps({ stops: STOPS, startLevel: "B3", gapTags: ["git"], completed: none });
    expect(ids(steps)).toEqual(["b3-a", "b3-b", "i1-a", "i1-b"]);
    expect(steps[0]).toEqual({ stopId: "b3-a", reason: "review", gapTag: "git" });
  });

  it("ignores gaps whose only stop is above the start level", () => {
    const steps = nextSteps({ stops: STOPS, startLevel: "B1", gapTags: ["tokens"], completed: none });
    expect(steps.every((s) => s.reason === "next")).toBe(true);
  });

  it("skips completed stops, both on the path and for review", () => {
    const completed = new Set(["b1-b", "b3-a", "b3-b"]);
    const steps = nextSteps({ stops: STOPS, startLevel: "B3", gapTags: ["prompting", "ai-basics"], completed });
    expect(ids(steps)).toEqual(["b1-a", "i1-a", "i1-b"]);
  });

  it("returns fewer than five near the end of the path, and none when everything is done", () => {
    expect(ids(nextSteps({ stops: STOPS, startLevel: "I1", gapTags: [], completed: none }))).toEqual(["i1-a", "i1-b"]);
    const all = new Set(STOPS.map((s) => s.id));
    expect(nextSteps({ stops: STOPS, startLevel: "B1", gapTags: ["ai-basics"], completed: all })).toEqual([]);
  });

  it("returns nothing when the start level has no stops written yet and none above", () => {
    expect(nextSteps({ stops: STOPS, startLevel: "P3", gapTags: [], completed: none })).toEqual([]);
  });

  it("never returns duplicates or more than the count", () => {
    const steps = nextSteps({ stops: STOPS, startLevel: "B1", gapTags: ["ai-basics", "ai-basics", "prompting"], completed: none, count: 3 });
    expect(ids(steps)).toEqual(["b1-a", "b1-b", "b2-a"]);
    expect(new Set(ids(steps)).size).toBe(steps.length);
  });
});

describe("reviewStopFor (PL-4)", () => {
  it("picks the first stop in path order at or below the start level", () => {
    const stops = [stop("late", "B2", ["x"]), stop("early", "B1", ["x"])];
    expect(reviewStopFor(stops, "B3", "x")?.id).toBe("late");
    expect(reviewStopFor(stops, "B1", "x")?.id).toBe("early");
    expect(reviewStopFor([stops[0]], "B1", "x")).toBeUndefined();
  });
});
