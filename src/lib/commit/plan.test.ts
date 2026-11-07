import { describe, expect, it } from "vitest";
import { COMMIT_WEEKS, dueWeek, weekOf, weeklyEmail } from "./plan";

describe("90-day commitment (CM-90)", () => {
  it("counts weeks from the start date", () => {
    expect(weekOf("2026-11-09", "2026-11-08")).toBe(0);
    expect(weekOf("2026-11-09", "2026-11-09")).toBe(1);
    expect(weekOf("2026-11-09", "2026-11-15")).toBe(1);
    expect(weekOf("2026-11-09", "2026-11-16")).toBe(2);
  });

  it("sends one email a week, at most 13, and never after unsubscribing", () => {
    const c = { started_on: "2026-11-09", last_sent_week: 0, unsubscribed_at: null };
    expect(dueWeek(c, "2026-11-09")).toBe(1);
    expect(dueWeek({ ...c, last_sent_week: 1 }, "2026-11-12")).toBeNull();
    expect(dueWeek({ ...c, last_sent_week: 1 }, "2026-11-16")).toBe(2);
    expect(dueWeek({ ...c, last_sent_week: 13 }, "2027-06-01")).toBeNull();
    expect(dueWeek({ ...c, last_sent_week: 12 }, "2027-06-01")).toBe(COMMIT_WEEKS);
    expect(dueWeek({ ...c, unsubscribed_at: "2026-11-10T00:00:00Z" }, "2026-11-16")).toBeNull();
  });

  it("writes an email with progress, the next lessons and a way to stop, with text escaped", () => {
    const e = weeklyEmail({
      week: 3,
      pathName: "AI Engineer",
      done: 5,
      total: 50,
      doneThisWeek: 2,
      next: [{ id: "embeddings", title: "Embeddings <and> vectors" }],
      siteUrl: "https://xplaind.in",
      unsubscribeUrl: "https://xplaind.in/api/commit/unsubscribe?token=t",
    });
    expect(e.subject).toBe("Week 3 of 13 on AI Engineer: your next lessons");
    expect(e.text).toContain("You finished 2 lessons this week. 5 of 50 done on AI Engineer.");
    expect(e.text).toContain("https://xplaind.in/stop/embeddings");
    expect(e.text).toContain("Stop these emails: https://xplaind.in/api/commit/unsubscribe?token=t");
    expect(e.html).toContain("Embeddings &lt;and&gt; vectors");
    expect(e.html).not.toMatch(/<img/);
  });

  it("closes the 13 weeks warmly", () => {
    const e = weeklyEmail({ week: 13, pathName: "AI Engineer", done: 30, total: 50, doneThisWeek: 0, next: [], siteUrl: "https://xplaind.in", unsubscribeUrl: "u" });
    expect(e.subject).toContain("Week 13 of 13");
    expect(e.text).toContain("Thank you for sticking with it");
  });
});
