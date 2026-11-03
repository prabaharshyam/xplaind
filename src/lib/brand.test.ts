import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// BR-1 and BR-2: the brand system in docs/brand.md, checked over every source file.
const SRC = path.join(process.cwd(), "src");
const files = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return files(p);
    return /\.(tsx?|css)$/.test(e.name) && !e.name.endsWith(".test.ts") ? [p] : [];
  });
const sources = files(SRC).map((p) => ({ p: path.relative(process.cwd(), p), text: fs.readFileSync(p, "utf8") }));

const hits = (re: RegExp) => sources.flatMap(({ p, text }) => [...text.matchAll(re)].map((m) => `${p}: ${m[0]}`));

const UTILITIES = "bg|text|border|ring|from|via|to|fill|stroke|outline|shadow|decoration|divide|accent|caret|placeholder";

describe("brand system", () => {
  it("uses only the seven colour families (BR-1)", () => {
    const off = new RegExp(`\\b(?:${UTILITIES})-(?:slate|gray|neutral|stone|red|orange|yellow|lime|green|cyan|blue|indigo|purple|fuchsia|pink)-\\d{2,3}\\b`, "g");
    expect(hits(off)).toEqual([]);
  });

  it("keeps every tap target at 44 px or more (BR-2)", () => {
    expect(hits(/\bmin-h-(?:8|9|10)\b/g)).toEqual([]);
  });

  it("uses three corner sizes (BR-2)", () => {
    expect(hits(/(?<![\w-])rounded-(?:md|lg|xl)\b/g)).toEqual([]);
  });
});
