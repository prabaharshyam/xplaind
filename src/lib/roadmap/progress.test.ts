import { describe, expect, it } from "vitest";
import { afterCheck, checkPercent, completedIds, coverage, isProjectUrl, markDone, passesCheck, statusOf } from "./progress";
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
    { id: "b1", level: "B1", order: 1, hours: 2, gap_tags: [] },
    { id: "b2a", level: "B2", order: 1, hours: 6, gap_tags: [] },
    { id: "b2b", level: "B2", order: 2, hours: 2, gap_tags: [] },
    { id: "b3", level: "B3", order: 1, hours: 2, gap_tags: [] },
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
