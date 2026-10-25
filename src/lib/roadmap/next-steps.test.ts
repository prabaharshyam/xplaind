import { describe, expect, it } from "vitest";
import type { LevelId } from "@/lib/levels";
import { nextSteps, reviewStopFor } from "./next-steps";
import type { RoadmapStop } from "./types";

const stop = (id: string, level: LevelId, order: number, gap_tags: string[] = [], hours = 2): RoadmapStop => ({
  id,
  level,
  order,
  hours,
  gap_tags,
});

// Two stops per level for B1 to I1, listed out of order on purpose.
const STOPS: RoadmapStop[] = [
  stop("i1-b", "I1", 2),
  stop("b1-a", "B1", 1, ["ai-basics"]),
  stop("b2-b", "B2", 2, ["python-files"]),
  stop("b1-b", "B1", 2, ["prompting"]),
  stop("b3-a", "B3", 1, ["git"]),
  stop("b2-a", "B2", 1, ["python-basics"]),
  stop("i1-a", "I1", 1, ["tokens"]),
  stop("b3-b", "B3", 2, ["pandas"]),
];
const ids = (steps: { stopId: string }[]) => steps.map((s) => s.stopId);
const none = new Set<string>();

describe("nextSteps (RM-3)", () => {
  it("lists five stops from the start level in ladder order when there are no gaps", () => {
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
  it("picks the easiest stop at or below the start level", () => {
    const stops = [stop("late", "B2", 1, ["x"]), stop("early", "B1", 3, ["x"])];
    expect(reviewStopFor(stops, "B3", "x")?.id).toBe("early");
    expect(reviewStopFor(stops, "B1", "x")?.id).toBe("early");
    expect(reviewStopFor([stops[0]], "B1", "x")).toBeUndefined();
  });
});
