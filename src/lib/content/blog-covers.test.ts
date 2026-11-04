import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getBlogPosts } from "./index";

// BL-1: every guide has a cover picture, and the file it names is in public/.
describe("guide covers (BL-1)", () => {
  it("every guide names a cover that exists", () => {
    const missing = getBlogPosts()
      .filter((p) => !p.cover || !existsSync(join(process.cwd(), "public", p.cover.src)))
      .map((p) => p.id);
    expect(missing).toEqual([]);
  });
});
