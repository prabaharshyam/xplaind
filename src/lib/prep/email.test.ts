import { describe, expect, it } from "vitest";
import { prepEmail, reminderDue } from "./email";
import { prepPlan, type PrepSetup } from "./plan";

const setup: PrepSetup = { interviewOn: "2026-12-06", pathId: "role", experience: "mid", minutes: 60, startedOn: "2026-11-26" };
const ids = Array.from({ length: 100 }, (_, i) => `q${i + 1}`);
const on = (today: string, ratings = {}) => {
  const plan = prepPlan(setup, ids, ratings, today);
  if (plan.status !== "ok") throw new Error(plan.status);
  return prepEmail({ plan, role: "AI Engineer", siteUrl: "https://xplaind.in", unsubscribeUrl: "https://xplaind.in/api/prep/remind/unsubscribe?token=t" });
};

describe("PREP-7 the daily reminder email", () => {
  it("says the days left, what today holds, the progress, and links to the plan and to stopping", () => {
    const e = on("2026-11-28", { q1: { rating: 0, updatedOn: "2026-11-26" }, q2: { rating: 2, updatedOn: "2026-11-26" } });
    expect(e.subject).toBe("8 days to your AI Engineer interview: 1 to revise, 9 new questions, a short mock interview");
    expect(e.text).toContain("Today: 1 to revise, 9 new questions, a short mock interview.");
    expect(e.text).toContain("2 of 100 questions covered so far.");
    expect(e.text).toContain("Open my plan: https://xplaind.in/interview/prep");
    expect(e.text).toContain("Stop these emails: https://xplaind.in/api/prep/remind/unsubscribe?token=t");
    expect(e.html).toContain('href="https://xplaind.in/interview/prep"');
    expect(e.html).not.toMatch(/<img/i); // no tracking pixel
  });

  it("the day before is revision and the checklist; the day itself has no questions", () => {
    expect(on("2026-12-05").text).toContain("Today is for revision only");
    const day = on("2026-12-06");
    expect(day.subject).toBe("Your interview is today: the checklist");
    expect(day.text).toContain("No new questions today");
  });

  it("is due once a day, never after unsubscribing, and never after the interview", () => {
    const plan = prepPlan(setup, ids, {}, "2026-11-28");
    expect(reminderDue({ last_sent_on: "2026-11-27", unsubscribed_at: null }, plan, "2026-11-28")).toBe(true);
    expect(reminderDue({ last_sent_on: null, unsubscribed_at: null }, plan, "2026-11-28")).toBe(true);
    expect(reminderDue({ last_sent_on: "2026-11-28", unsubscribed_at: null }, plan, "2026-11-28")).toBe(false);
    expect(reminderDue({ last_sent_on: null, unsubscribed_at: "2026-11-27T00:00:00Z" }, plan, "2026-11-28")).toBe(false);
    expect(reminderDue({ last_sent_on: null, unsubscribed_at: null }, prepPlan(setup, ids, {}, "2026-12-07"), "2026-12-07")).toBe(false);
  });
});
