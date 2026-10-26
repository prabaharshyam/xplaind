import { describe, expect, it } from "vitest";
import { afterCheck, checkPercent, completedIds, coverage, isProjectUrl, markDone, passesCheck, recordFor, stateCounts, statusOf, topicStateOf } from "./progress";
import type { ProgressMap, RoadmapStop } from "./types";

const T = "2026-10-25";

describe("check scoring (RM-7)", () => {
  it("passes at 70% or more, rounding down", () => {
    expect(checkPercent(3, 3)).toBe(100);
    expect(checkPercent(2, 3)).toBe(66);
    expect(checkPercent(3, 4)).toBe(75);
    expect(checkPercent(7, 10)).toBe(70);
    expect(passesCheck(70)).toBe(true);
    expect(passesCheck(69)).toBe(false);
    expect(passesCheck(checkPercent(2, 3))).toBe(false);
    expect(() => checkPercent(1, 0)).toThrow(RangeError);
    expect(() => checkPercent(4, 3)).toThrow(RangeError);
  });

  it("a pass marks the stop done by check", () => {
    expect(afterCheck(undefined, 100, T)).toEqual({ status: "done", how: "check", score: 100, updatedOn: T });
  });

  it("a fail leaves the stop in progress and keeps the best score", () => {
    const first = afterCheck(undefined, 33, T);
    expect(first).toEqual({ status: "in_progress", score: 33, updatedOn: T });
    expect(afterCheck(first, 0, T).score).toBe(33);
  });

  it("a fail never undoes a stop that is already done", () => {
    const skipped = markDone("self_skipped", T);
    expect(afterCheck(skipped, 33, T)).toMatchObject({ status: "done", how: "self_skipped", score: 33 });
  });
});

describe("statuses (RM-7, RM-8)", () => {
  const progress: ProgressMap = {
    a: { status: "in_progress", updatedOn: T },
    b: markDone("self_skipped", T),
    c: markDone("project", T, "https://github.com/me/app"),
  };

  it("has three states", () => {
    expect(statusOf(progress, "a")).toBe("in_progress");
    expect(statusOf(progress, "b")).toBe("done");
    expect(statusOf(progress, "zzz")).toBe("not_started");
  });

  it("counts a self-skip as done", () => {
    expect(completedIds(progress)).toEqual(new Set(["b", "c"]));
  });

  it("keeps the project link", () => {
    expect(progress.c).toEqual({ status: "done", how: "project", projectUrl: "https://github.com/me/app", updatedOn: T });
  });
});

describe("isProjectUrl", () => {
  it("accepts shareable web links only", () => {
    expect(isProjectUrl("https://github.com/me/app")).toBe(true);
    expect(isProjectUrl("  http://my-site.in/demo ")).toBe(true);
    expect(isProjectUrl("github.com/me/app")).toBe(false);
    expect(isProjectUrl("javascript:alert(1)")).toBe(false);
    expect(isProjectUrl("https://localhost")).toBe(false);
    expect(isProjectUrl("")).toBe(false);
  });
});

describe("coverage (percent covered)", () => {
  const stops: RoadmapStop[] = [
    { id: "b1", level: "B1", hours: 2, gap_tags: [] },
    { id: "b2a", level: "B2", hours: 6, gap_tags: [] },
    { id: "b2b", level: "B2", hours: 2, gap_tags: [] },
    { id: "b3", level: "B3", hours: 2, gap_tags: [] },
  ];

  it("is weighted by hours and measured from the start level", () => {
    const progress: ProgressMap = { b1: markDone("self_skipped", T), b2a: markDone("project", T, "https://a.in") };
    expect(coverage(stops, "B2", progress)).toEqual({ doneHours: 6, totalHours: 10, percent: 60, done: 1, skipped: 0, total: 3 });
  });

  it("counts skipped stops separately (RM-8)", () => {
    const progress: ProgressMap = { b2b: markDone("self_skipped", T), b3: { status: "in_progress", updatedOn: T } };
    expect(coverage(stops, "B2", progress)).toMatchObject({ percent: 20, done: 1, skipped: 1 });
  });

  it("is 0 when no stops are written from the start level", () => {
    expect(coverage(stops, "P3", {})).toEqual({ doneHours: 0, totalHours: 0, percent: 0, done: 0, skipped: 0, total: 0 });
  });
});

describe("roadmap topic states (RM-7 as amended, RM-8)", () => {
  const T2 = "2026-10-27";
  it("maps progress records to to do, learning, done and skipped", () => {
    const progress: ProgressMap = {
      a: { status: "in_progress", updatedOn: T2 },
      b: markDone("self_marked", T2),
      c: markDone("self_skipped", T2),
      d: { status: "done", how: "check", score: 80, updatedOn: T2 },
    };
    expect(["a", "b", "c", "d", "e"].map((id) => topicStateOf(progress, id))).toEqual(["learning", "done", "skipped", "done", "todo"]);
  });

  it("stores a one-tap done as self-marked, but keeps a passed check", () => {
    expect(recordFor(undefined, "done", T2)).toEqual({ status: "done", how: "self_marked", updatedOn: T2 });
    const checked = { status: "done", how: "check", score: 90, updatedOn: "2026-10-01" } as const;
    expect(recordFor(checked, "done", T2)).toBe(checked);
    expect(recordFor(undefined, "skipped", T2)).toEqual({ status: "done", how: "self_skipped", updatedOn: T2 });
    expect(recordFor(checked, "learning", T2)).toEqual({ status: "in_progress", score: 90, updatedOn: T2 });
    expect(recordFor(checked, "todo", T2)).toBeNull();
  });

  it("counts states and treats done and skipped as finished", () => {
    const progress: ProgressMap = { a: markDone("self_marked", T2), b: markDone("self_skipped", T2), c: { status: "in_progress", updatedOn: T2 } };
    expect(stateCounts(["a", "b", "c", "d"], progress)).toEqual({ todo: 1, learning: 1, done: 1, skipped: 1, total: 4, percent: 50 });
    expect(stateCounts([], {}).percent).toBe(0);
  });
});
