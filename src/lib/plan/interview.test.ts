import { describe, expect, it } from "vitest";
import { interviewPlan, MAX_DAYS_AHEAD } from "./interview";
import type { LessonState, PlanLesson } from "./weekly";

const lessons: PlanLesson[] = Array.from({ length: 10 }, (_, i) => ({ id: `l${i + 1}`, title: `Lesson ${i + 1}`, hours: 2 }));
const none = (): LessonState => undefined;

describe("PP-1 plan to an interview date", () => {
  it("refuses a date today or before, and one more than a year ahead", () => {
    expect(interviewPlan(lessons, none, "2026-11-14", "2026-11-14", 6).status).toBe("past");
    expect(interviewPlan(lessons, none, "2026-11-14", "2026-11-01", 6).status).toBe("past");
    const far = new Date(Date.UTC(2026, 10, 14 + MAX_DAYS_AHEAD + 1)).toISOString().slice(0, 10);
    expect(interviewPlan(lessons, none, "2026-11-14", far, 6).status).toBe("too_far");
  });

  it("fills weeks in roadmap order and keeps the last week for interview practice", () => {
    const p = interviewPlan(lessons, none, "2026-11-14", "2026-12-05", 6); // 21 days: three weeks
    if (p.status !== "ok") throw new Error(p.status);
    expect(p.daysLeft).toBe(21);
    expect(p.weeks.map((w) => [w.start, w.end])).toEqual([
      ["2026-11-14", "2026-11-20"],
      ["2026-11-21", "2026-11-27"],
      ["2026-11-28", "2026-12-04"],
    ]);
    expect(p.weeks[0].lessonIds).toEqual(["l1", "l2", "l3"]);
    expect(p.weeks[1].lessonIds).toEqual(["l4", "l5", "l6"]);
    expect(p.weeks[2]).toMatchObject({ practice: true, lessonIds: [] });
    expect(p.leftOut).toBe(4);
    expect(p.neededPerWeek).toBe(10); // 20 open hours over two study weeks
  });

  it("skips done lessons and puts started ones first", () => {
    const state = (id: string): LessonState => (id === "l1" ? "done" : id === "l5" ? "in_progress" : undefined);
    const p = interviewPlan(lessons, state, "2026-11-14", "2026-12-05", 6);
    if (p.status !== "ok") throw new Error(p.status);
    expect(p.weeks[0].lessonIds).toEqual(["l5", "l2", "l3"]);
  });

  it("with one week, keeps two hours for practice and still plans a lesson", () => {
    const p = interviewPlan(lessons, none, "2026-11-14", "2026-11-17", 4); // 3 days
    if (p.status !== "ok") throw new Error(p.status);
    expect(p.weeks).toHaveLength(1);
    expect(p.weeks[0].practice).toBe(true);
    expect(p.weeks[0].lessonIds).toEqual(["l1"]);
    expect(p.weeks[0].end).toBe("2026-11-16");
  });

  it("fits everything when there is time", () => {
    const p = interviewPlan(lessons, none, "2026-11-14", "2027-02-13", 6);
    if (p.status !== "ok") throw new Error(p.status);
    expect(p.leftOut).toBe(0);
    expect(p.weeks.flatMap((w) => w.lessonIds)).toHaveLength(10);
  });
});
