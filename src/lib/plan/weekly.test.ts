import { describe, expect, it } from "vitest";
import { currentPlan, googleCalendarLink, nextMonday, planWeek, reminderIcs, weekOf } from "./weekly";

const L = (id: string, hours: number) => ({ id, title: id.toUpperCase(), hours });
const lessons = [L("a", 2), L("b", 3), L("c", 1), L("d", 2), L("e", 4)];

describe("weekly study plan (WP-1, WP-2)", () => {
  it("runs Monday to Sunday", () => {
    expect(weekOf("2026-11-02")).toEqual({ start: "2026-11-02", end: "2026-11-08" }); // a Monday
    expect(weekOf("2026-11-08")).toEqual({ start: "2026-11-02", end: "2026-11-08" }); // a Sunday
    expect(weekOf("2026-11-04")).toEqual({ start: "2026-11-02", end: "2026-11-08" });
  });

  it("fills the week's hours in roadmap order, after a practice session", () => {
    const p = planWeek(lessons, () => undefined, 6);
    expect(p.items.map((i) => i.id)).toEqual(["a", "b"]); // 5.5 h budget: 2 + 3, then c (1 h) would pass it
    expect(p.hours).toBe(5);
    expect(p.left).toBe(3);
  });

  it("skips done lessons and puts started ones first", () => {
    const state = (id: string) => (id === "a" ? "done" : id === "d" ? "in_progress" : undefined);
    expect(planWeek(lessons, state, 6).items.map((i) => i.id)).toEqual(["d", "b"]);
  });

  it("never comes up empty, even when the next lesson is longer than the week", () => {
    expect(planWeek([L("long", 5)], () => undefined, 2).items.map((i) => i.id)).toEqual(["long"]);
    expect(planWeek(lessons, () => "done", 6).items).toEqual([]);
  });

  it("keeps this week's plan while lessons are ticked, and makes a new one for a new week or settings", () => {
    const saved = { week: "2026-11-02", pathId: "ai-engineer", hours: 6, lessonIds: ["a", "b"] };
    const make = () => ["x"];
    expect(currentPlan(saved, "2026-11-02", "ai-engineer", 6, make)).toBe(saved);
    expect(currentPlan(saved, "2026-11-09", "ai-engineer", 6, make).lessonIds).toEqual(["x"]);
    expect(currentPlan(saved, "2026-11-02", "ml-engineer", 6, make).lessonIds).toEqual(["x"]);
    expect(currentPlan(saved, "2026-11-02", "ai-engineer", 10, make).lessonIds).toEqual(["x"]);
  });
});

describe("weekly reminder (WP-3)", () => {
  it("starts on the next Monday", () => {
    expect(nextMonday("2026-11-02")).toBe("2026-11-02");
    expect(nextMonday("2026-11-03")).toBe("2026-11-09");
    expect(nextMonday("2026-11-08")).toBe("2026-11-09");
  });

  it("is a weekly 9 am India-time event in the calendar file and the Google link", () => {
    const ics = reminderIcs("2026-11-09", "https://xplaind.in/plan", new Date("2026-11-02T00:00:00Z"));
    expect(ics).toContain("DTSTART;TZID=Asia/Kolkata:20261109T090000");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO");
    expect(ics).toContain("URL:https://xplaind.in/plan");
    expect(ics.split("\r\n")[0]).toBe("BEGIN:VCALENDAR");
    const g = new URL(googleCalendarLink("2026-11-09", "https://xplaind.in/plan"));
    expect(g.searchParams.get("dates")).toBe("20261109T090000/20261109T093000");
    expect(g.searchParams.get("ctz")).toBe("Asia/Kolkata");
    expect(g.searchParams.get("recur")).toBe("RRULE:FREQ=WEEKLY;BYDAY=MO");
  });
});
