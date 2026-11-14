import { describe, expect, it } from "vitest";
import { type NudgeInput, nudges } from "./nudges";

const base: NudgeInput = {
  today: "2026-11-14",
  activeDays: new Set(["2026-11-13", "2026-11-12"]),
  streak: 2,
  hasTest: true,
  interviewOn: null,
  path: { id: "ai-engineer", name: "AI Engineer" },
  nextLesson: { id: "rag-basics", title: "RAG basics" },
  openLessons: 20,
  week: null,
};
const ids = (i: Partial<NudgeInput>) => nudges({ ...base, ...i }).map((n) => n.id);

describe("NG-1 nudges", () => {
  it("puts a close interview first and links to the role's mock interview", () => {
    const n = nudges({ ...base, interviewOn: "2026-11-20" });
    expect(n[0]).toMatchObject({ id: "interview", href: "/interview/simulator?path=ai-engineer" });
    expect(n[0].text).toContain("6 days");
    expect(ids({ interviewOn: "2026-12-30" })).not.toContain("interview");
    expect(ids({ interviewOn: "2026-11-14" })).not.toContain("interview");
  });
  it("sends a brand-new learner to the 2-minute check", () => {
    expect(ids({ activeDays: new Set(), streak: 0, hasTest: false })).toEqual(["first"]);
  });
  it("keeps a streak going only when today has no study yet", () => {
    expect(ids({})).toContain("streak");
    expect(ids({ activeDays: new Set(["2026-11-14", "2026-11-13"]) })).not.toContain("streak");
    expect(ids({ streak: 1 })).not.toContain("streak");
  });
  it("welcomes back after a week away instead of talking about streaks", () => {
    const n = nudges({ ...base, activeDays: new Set(["2026-11-01"]), streak: 0 });
    expect(n[0]).toMatchObject({ id: "back", href: "/stop/rag-basics" });
    expect(n[0].text).toContain("13 days");
  });
  it("nudges near the end of the week's plan and of the roadmap, two at most", () => {
    expect(ids({ week: { done: 3, total: 4 } })).toContain("week");
    expect(ids({ week: { done: 4, total: 4 } })).not.toContain("week");
    expect(ids({ openLessons: 2 })).toContain("finish");
    expect(nudges({ ...base, interviewOn: "2026-11-20", week: { done: 3, total: 4 }, openLessons: 2 })).toHaveLength(2);
  });
});
