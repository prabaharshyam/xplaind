import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// NV-4: pages open at the top. A component that calls scrollIntoView when it appears pulls the
// whole page to itself (the lesson tutor once opened every lesson at its own chat box), so only
// code that scrolls after the learner asks for it may use it. Chat boxes scroll their own list.
const ALLOWED: Record<string, string> = {
  "src/components/motion/site-motion.tsx": "in-page #section links and Back/Forward",
  "src/components/roadmap/roadmap-view.tsx": "the learner clicks a stage's Projects link",
  "src/app/ai/book/book-studio.tsx": "the learner moves to the next screen of the book test",
};

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return files(p);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [p] : [];
  });
}

describe("nothing scrolls the page by itself (NV-4)", () => {
  it("calls scrollIntoView only where the learner asked to move", () => {
    const callers = files("src").filter((f) => readFileSync(f, "utf8").includes("scrollIntoView("));
    expect(callers.filter((f) => !(f in ALLOWED))).toEqual([]);
  });

  it("chat boxes scroll their own list, not the page", () => {
    for (const f of ["src/components/ai/ai-chat.tsx", "src/components/bot/x-bot.tsx"]) {
      const src = readFileSync(f, "utf8");
      expect(src, f).toContain("scrollTop = ");
      expect(src, f).not.toContain("scrollIntoView(");
    }
  });
});
