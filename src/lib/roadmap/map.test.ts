import { describe, expect, it } from "vitest";
import { stageOf, topicsWithStops } from "./map";
import type { RoadmapStop } from "./types";

const topic = (id: string, optional = false) => ({ id, title: id, summary: "s", optional });
const stop = (id: string, level: "B1" | "B2", gap_tags: string[]): RoadmapStop => ({ id, level, hours: 2, gap_tags });

describe("topicsWithStops (RM-1)", () => {
  const stops = [stop("first", "B1", ["a", "b"]), stop("later", "B1", ["a"]), stop("other-level", "B2", ["c"])];

  it("pairs each topic with the first stop at its level that teaches it", () => {
    expect(topicsWithStops("B1", [topic("a"), topic("b")], stops).map((t) => t.stopId)).toEqual(["first", "first"]);
  });

  it("leaves a topic without a stop as coming soon, even if another level teaches it", () => {
    expect(topicsWithStops("B1", [topic("c"), topic("d", true)], stops)).toEqual([
      { ...topic("c"), stopId: null },
      { ...topic("d", true), stopId: null },
    ]);
  });

  it("keeps the topic order from the content file", () => {
    expect(topicsWithStops("B1", [topic("b"), topic("a")], stops).map((t) => t.id)).toEqual(["b", "a"]);
  });
});

describe("stageOf", () => {
  it("groups levels into three lines", () => {
    expect(["B1", "B3", "I2", "P1"].map((l) => stageOf(l as never))).toEqual(["beginner", "beginner", "intermediate", "pro"]);
  });
});
