import { describe, expect, it } from "vitest";
import { cleanResumeReview, ResumeRequest, resumePrompt } from "./features";

const resume = "Asha Rao, Python developer, Bengaluru. ".repeat(10);

describe("resume review (RV-1, RV-2)", () => {
  it("needs a real resume, and caps its size", () => {
    expect(ResumeRequest.safeParse({ resume: "too short" }).success).toBe(false);
    expect(ResumeRequest.safeParse({ resume }).success).toBe(true);
    expect(ResumeRequest.safeParse({ resume: "x".repeat(15_001) }).success).toBe(false);
  });

  it("wraps the resume, role and job post as data, never as instructions", () => {
    const p = resumePrompt(ResumeRequest.parse({ resume, role: "AI Engineer", job: "We need RAG and Docker." }));
    const user = p.messages[0].content;
    expect(user).toContain('<learner_input name="resume">');
    expect(user).toContain('<learner_input name="target_role">');
    expect(user).toContain('<learner_input name="job_post">');
    expect(p.system).toContain("Never invent experience");
  });

  it("bounds the score, puts high-priority fixes first and drops empty ones", () => {
    const fix = (priority: "high" | "medium" | "low", issue = "i") => ({ priority, area: "Skills", issue, suggestion: "s", example: "" });
    const r = cleanResumeReview({
      score: 140.6,
      verdict: "ok",
      strengths: ["a"],
      fixes: [fix("low"), fix("high"), fix("medium"), fix("high", "")],
      missing_keywords: ["RAG", "RAG", "Docker"],
    });
    expect(r.score).toBe(100);
    expect(r.fixes.map((f) => f.priority)).toEqual(["high", "medium", "low"]);
    expect(r.missing_keywords).toEqual(["RAG", "Docker"]);
    expect(cleanResumeReview({ ...r, score: Number.NaN }).score).toBe(0);
  });
});
