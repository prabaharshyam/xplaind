import path from "node:path";
import { describe, expect, it } from "vitest";
import { getLibrary } from "./papers";
import { LibraryItem } from "./schema";

describe("papers and free books (LB-1)", () => {
  const items = getLibrary(path.resolve(__dirname, "../../../content"));

  it("loads and validates the library file", () => {
    expect(items.length).toBeGreaterThan(50);
    expect(items.find((i) => i.id === "attention-is-all-you-need")?.url).toBe("https://arxiv.org/pdf/1706.03762");
  });

  it("says who hosts every file, so we only ever link to the authors' own copy (BK-3)", () => {
    for (const i of items) expect(i.hosted_by.length, i.id).toBeGreaterThan(2);
  });

  it("rejects a why line over 40 words", () => {
    const ok = items[0];
    expect(LibraryItem.safeParse({ ...ok, why: Array(41).fill("word").join(" ") }).success).toBe(false);
  });
});
