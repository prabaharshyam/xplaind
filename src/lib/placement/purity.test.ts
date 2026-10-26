import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// PL-6: scoring and placement live in one pure module with no database or UI imports.
// This test reads the source files and fails if a runtime import points outside it.
const dir = __dirname;
const sources = fs.readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
const ALLOWED = /^(\.\/|@\/lib\/levels$)/;

describe("placement module purity (PL-6)", () => {
  it("has source files to check", () => {
    expect(sources.length).toBeGreaterThanOrEqual(4);
  });

  for (const file of sources) {
    it(`${file} imports only the level helpers and its own files`, () => {
      const text = fs.readFileSync(path.join(dir, file), "utf8");
      const imports = [...text.matchAll(/^import\s+(type\s+)?[^;]*?from\s+"([^"]+)"/gm)]
        .filter((m) => !m[1]) // type-only imports are erased and cannot pull code in
        .map((m) => m[2]);
      const offenders = imports.filter((spec) => !ALLOWED.test(spec));
      expect(offenders).toEqual([]);
    });
  }
});
