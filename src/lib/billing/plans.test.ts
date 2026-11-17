import { TRIAL_QUESTIONS } from "@/lib/ai/voice-interview";
import { describe, expect, it } from "vitest";
import { DAILY_LIMIT } from "@/lib/ai/limits";
import { PLANS, TIER_LIMITS, dailyLimit, isPlanId, monthlyEquivalentPaise, newOrderId, perDay, rupees, savingPercent, trialLeftToday } from "./plans";

describe("Pro passes and limits (PAY-1)", () => {
  it("prices the three passes in paise and shows them in rupees", () => {
    expect([PLANS.pass_month.paise, PLANS.pass_6month.paise, PLANS.pass_year.paise]).toEqual([24_900, 99_900, 149_900]);
    expect(rupees(149_900)).toBe("₹1,499");
    expect(rupees(24_900)).toBe("₹249");
    expect(isPlanId("pass_year")).toBe(true);
    expect(isPlanId("pro_forever")).toBe(false);
  });

  it("keeps today's limits for everyone until Pro opens", () => {
    for (const tier of ["guest", "free", "pro"] as const) expect(dailyLimit("tutor", tier, false, DAILY_LIMIT)).toBe(DAILY_LIMIT.tutor);
  });

  it("gives Pro more of every feature than a free learner, and a free learner at least a guest", () => {
    // VI-13: the free AI interview's own counters exist only for free accounts (Pro uses voice for everything).
    const trialOnly = ["voice_start", "voice_trial"];
    for (const kind of (Object.keys(TIER_LIMITS.pro) as (keyof typeof TIER_LIMITS.pro)[]).filter((k) => !trialOnly.includes(k))) {
      expect(dailyLimit(kind, "pro", true, DAILY_LIMIT)).toBeGreaterThan(dailyLimit(kind, "free", true, DAILY_LIMIT));
      expect(dailyLimit(kind, "free", true, DAILY_LIMIT)).toBeGreaterThanOrEqual(dailyLimit(kind, "guest", true, DAILY_LIMIT));
    }
  });

  it("gives a free account a one-time trial of 2 or 3 tries per AI helper (PAY-7)", () => {
    // Reading pictures in notes (MB-12) and planning from a job description (VI-11) are Pro only. The AI
    // interviewer has its own trial (VI-13), checked below.
    const { scan, voice, voice_end, voice_plan, voice_start, voice_trial, ...trial } = TIER_LIMITS.free;
    expect(scan).toBe(0);
    expect(voice_plan).toBe(0);
    expect([voice, voice_end, voice_start, voice_trial]).toEqual([6, 60, 3, 2]);
    for (const n of Object.values(trial)) expect([2, 3]).toContain(n);
  });

  it("gives a free account one AI interview of 2 questions, with room for its follow-ups and one report (VI-13)", () => {
    const f = TIER_LIMITS.free;
    // At most 2 turns a question (a follow-up after the answer and after the first follow-up).
    expect(f.voice).toBeGreaterThanOrEqual(TRIAL_QUESTIONS * 2);
    // One report, plus one retry if it fails (the guard counts a call before it is made).
    expect(f.voice_trial).toBe(2);
    // Guests get none, and before Pro opens nobody gets a trial (the daily limits are the same for all).
    for (const k of ["voice", "voice_end", "voice_start", "voice_trial"] as const) {
      expect(TIER_LIMITS.guest[k]).toBe(0);
    }
    expect(DAILY_LIMIT.voice_start).toBe(0);
    expect(DAILY_LIMIT.voice_trial).toBe(0);
  });

  it("counts the trial across days: what is left today is the trial minus every earlier use (PAY-7)", () => {
    expect(trialLeftToday(3, 0)).toBe(3);
    expect(trialLeftToday(3, 2)).toBe(1);
    expect(trialLeftToday(3, 3)).toBe(0);
    expect(trialLeftToday(3, 10)).toBe(0);
    expect(trialLeftToday(3, -1)).toBe(3);
  });

  it("shows savings only against the real monthly price, and the price per day (PAY-8)", () => {
    expect(monthlyEquivalentPaise(PLANS.pass_6month)).toBe(149_400);
    expect(savingPercent(PLANS.pass_6month)).toBe(33);
    expect(monthlyEquivalentPaise(PLANS.pass_year)).toBe(298_800);
    expect(savingPercent(PLANS.pass_year)).toBe(50);
    expect([perDay(PLANS.pass_month), perDay(PLANS.pass_6month), perDay(PLANS.pass_year)]).toEqual(["₹8.3", "₹5.5", "₹4.1"]);
    // Longer passes always cost less per month.
    expect(PLANS.pass_year.paise / 12).toBeLessThan(PLANS.pass_6month.paise / 6);
  });

  it("makes order ids Cashfree accepts", () => {
    const id = newOrderId(1_762_600_000_000, "a1-b2_c3/d4e5f6g7h8i9j0k1");
    expect(id).toMatch(/^xp_[A-Za-z0-9_-]{6,42}$/);
    expect(id.length).toBeLessThanOrEqual(45);
  });
});
