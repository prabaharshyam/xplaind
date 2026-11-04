import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { decodeCode, encodeCode, EXAMPLE_GROUPS, EXAMPLES } from "./examples";

describe("playground examples (PG-2)", () => {
  it("have unique ids, code, and link only to lessons that exist", () => {
    const lessons = new Set(
      fs.readdirSync(path.join(process.cwd(), "content", "stops"), { recursive: true }).map((f) => path.basename(String(f), ".mdx")),
    );
    expect(new Set(EXAMPLES.map((e) => e.id)).size).toBe(EXAMPLES.length);
    for (const e of EXAMPLES) {
      expect(e.code.trim().length).toBeGreaterThan(10);
      if (e.lesson) expect(lessons.has(e.lesson), e.lesson).toBe(true);
    }
  });

  it("sit in the three groups, each with starters and a tip (PG-5)", () => {
    for (const g of EXAMPLE_GROUPS) expect(EXAMPLES.filter((e) => e.group === g.id).length, g.id).toBeGreaterThanOrEqual(4);
    for (const e of EXAMPLES) {
      expect(e.tip.length, e.id).toBeGreaterThan(10);
      expect(e.code, e.id).not.toMatch(/\binput\(/); // the playground has no keyboard input yet
    }
  });

  it("round-trips code through a link, including Indian scripts and symbols", () => {
    const code = 'print("नमस्ते, ₹500 & <ok>")\n';
    expect(decodeCode(encodeCode(code))).toBe(code);
    expect(decodeCode("%%%not base64")).toBeNull();
  });
});
