import { describe, expect, it } from "vitest";
import { cleanProjectReview, PASS_MARK } from "@/lib/ai/features";
import { githubRepo } from "./readme";

describe("reading a project link (PR-1)", () => {
  it("accepts only https github.com repository links", () => {
    expect(githubRepo("https://github.com/asha/rag-bot")).toEqual({ owner: "asha", repo: "rag-bot" });
    expect(githubRepo("https://github.com/asha/rag-bot.git")).toEqual({ owner: "asha", repo: "rag-bot" });
    expect(githubRepo("https://github.com/asha/rag-bot/tree/main/src")).toEqual({ owner: "asha", repo: "rag-bot" });
    expect(githubRepo("http://github.com/asha/rag-bot")).toBeNull();
    expect(githubRepo("https://evil.com/asha/rag-bot")).toBeNull();
    expect(githubRepo("https://github.com/asha")).toBeNull();
    expect(githubRepo("https://github.com/../etc")).toBeNull();
    expect(githubRepo("not a link")).toBeNull();
  });
});

describe("cleaning a project review (PR-1)", () => {
  const rubric = [{ criterion: "Works end to end" }, { criterion: "Tested" }, { criterion: "Documented" }, { criterion: "Deployed" }];
  const c = (criterion: string, level: "strong" | "ok" | "weak") => ({ criterion, level, evidence: "seen", fix: "" });

  it("keeps one entry per real criterion and decides the pass itself", () => {
    const r = cleanProjectReview({ score: 82, summary: "Good", criteria: [c("Works end to end", "strong"), c("Tested", "ok"), c("Documented", "strong"), c("Deployed", "ok"), c("Invented", "weak")], next_steps: ["a"] }, rubric);
    expect(r.criteria.map((x) => x.criterion)).toEqual(rubric.map((x) => x.criterion));
    expect(r.passed).toBe(true);
  });

  it("fails below the pass mark or with any weak criterion", () => {
    const base = { summary: "", next_steps: [], criteria: rubric.map((x) => c(x.criterion, "ok")) };
    expect(cleanProjectReview({ ...base, score: PASS_MARK - 1 }, rubric).passed).toBe(false);
    expect(cleanProjectReview({ ...base, score: 95, criteria: [c("Works end to end", "weak"), ...base.criteria.slice(1)] }, rubric).passed).toBe(false);
    expect(cleanProjectReview({ ...base, score: 400 }, rubric).score).toBe(100);
  });
});
