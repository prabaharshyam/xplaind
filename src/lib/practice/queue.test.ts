import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isRating, practiceOrder, summarise, type Ratings } from "./queue";

const ids = ["a", "b", "c", "d", "e"];

describe("practiceOrder (IQ-4)", () => {
  it("keeps content order when nothing is rated", () => {
    expect(practiceOrder(ids, {})).toEqual(ids);
  });

  it("puts unrated first, then missed, partly and got it", () => {
    const ratings: Ratings = {
      a: { rating: 2, updatedOn: "2026-10-20" },
      b: { rating: 0, updatedOn: "2026-10-20" },
      c: { rating: 1, updatedOn: "2026-10-20" },
    };
    expect(practiceOrder(ids, ratings)).toEqual(["d", "e", "b", "c", "a"]);
  });

  it("brings back the oldest rating first within a rating", () => {
    const ratings: Ratings = {
      a: { rating: 0, updatedOn: "2026-10-24" },
      b: { rating: 0, updatedOn: "2026-10-01" },
      c: { rating: 0, updatedOn: "2026-10-24" },
    };
    expect(practiceOrder(["a", "b", "c"], ratings)).toEqual(["b", "a", "c"]);
  });

  it("ignores ratings for questions that are not in the list", () => {
    expect(practiceOrder(["a"], { zzz: { rating: 0, updatedOn: "2026-10-01" } })).toEqual(["a"]);
  });
});

describe("summarise", () => {
  it("counts each rating", () => {
    const ratings: Ratings = {
      a: { rating: 2, updatedOn: "2026-10-20" },
      b: { rating: 1, updatedOn: "2026-10-20" },
      c: { rating: 0, updatedOn: "2026-10-20" },
      x: { rating: 2, updatedOn: "2026-10-20" },
    };
    expect(summarise(ids, ratings)).toEqual({ total: 5, rated: 3, gotIt: 1, partly: 1, missed: 1 });
  });
});

describe("isRating", () => {
  it("accepts only 0, 1 and 2", () => {
    expect([0, 1, 2].every(isRating)).toBe(true);
    expect([3, -1, "2", null].some(isRating)).toBe(false);
  });
});

describe("practice module purity", () => {
  it("has no imports", () => {
    const text = fs.readFileSync(path.join(__dirname, "queue.ts"), "utf8");
    expect(text).not.toMatch(/^import /m);
  });
});
