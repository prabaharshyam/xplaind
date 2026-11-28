// CQ-5: every lesson, translation and blog body must compile as MDX, the way the site renders it. content:validate checks
// structure only, so a stray "<name>" in prose (read by MDX as a tag) once passed it and broke the whole build.
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";

const body = (file: string) => readFileSync(file, "utf8").replace(/^---\n[\s\S]*?\n---\n/, "");
const files = globSync("content/{stops/*,translations/*,blog}/*.mdx").sort();

describe("MDX bodies compile", () => {
  it("finds the content", () => expect(files.length).toBeGreaterThan(1000));
  it("every file compiles", async () => {
    const broken: string[] = [];
    for (const f of files) {
      try {
        await compile(body(f), { remarkPlugins: [remarkGfm] });
      } catch (e) {
        broken.push(`${f}: ${(e as Error).message.split("\n")[0]}`);
      }
    }
    expect(broken).toEqual([]);
  }, 120_000);
});
