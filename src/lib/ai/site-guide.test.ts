import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { tutorPrompt } from "./features";
import { SITE_GUIDE, siteGuideText } from "./site-guide";

describe("the AI tutor knows the site (FOCUS-2, took over from X Bot)", () => {
  it("only links to pages that exist", () => {
    for (const g of SITE_GUIDE) {
      const dir = path.join(process.cwd(), "src/app", g.h === "/" ? "" : g.h);
      expect(existsSync(path.join(dir, "page.tsx")), g.h).toBe(true);
    }
  });

  it("gets the site guide on its own page, but not inside a lesson", () => {
    const turns = [{ role: "user" as const, text: "Where do I practise interviews?" }];
    const general = tutorPrompt(null, { turns }, [], siteGuideText());
    expect(general.system).toContain("/interview/simulator | Practice a mock interview out loud");
    const lesson = tutorPrompt({ title: "RAG", outcome: "Build RAG", body: "text" }, { turns }, [], "");
    expect(lesson.system).not.toContain("Pages on Xplaind");
  });
});
