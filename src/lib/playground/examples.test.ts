import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { decodeCode, encodeCode, EXAMPLES } from "./examples";

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

  it("round-trips code through a link, including Indian scripts and symbols", () => {
    const code = 'print("नमस्ते, ₹500 & <ok>")\n';
    expect(decodeCode(encodeCode(code))).toBe(code);
    expect(decodeCode("%%%not base64")).toBeNull();
  });
});
