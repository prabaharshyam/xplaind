import { describe, expect, it } from "vitest";
import { AI_ALLOWANCE_FLOOR_INR, aiAllowanceInr, netRupees } from "./ai-allowance";
import { PLANS } from "./plans";

describe("the Pro AI allowance keeps every pass profitable (PAY-13)", () => {
  it("takes GST and gateway fees out of the price", () => {
    expect(Math.round(netRupees(24_900))).toBe(205);
  });

  it("gives each pass 60% of what it earns per 30 days, never under the floor", () => {
    expect(aiAllowanceInr(PLANS.pass_week.paise, "pass_week")).toBe(AI_ALLOWANCE_FLOOR_INR); // ₹49 share, floor ₹60
    expect(aiAllowanceInr(PLANS.pass_month.paise, "pass_month")).toBe(123);
    expect(aiAllowanceInr(PLANS.pass_6month.paise, "pass_6month")).toBe(81);
    expect(aiAllowanceInr(PLANS.pass_year.paise, "pass_year")).toBe(61);
  });

  it("uses what was actually paid, so a promo code lowers the allowance, and a ₹0 or missing payment gets the floor", () => {
    expect(aiAllowanceInr(74_900, "pass_6month")).toBe(61); // PRODUCTHUNT: 25% off the 6-month pass
    expect(aiAllowanceInr(0, "pass_month")).toBe(AI_ALLOWANCE_FLOOR_INR);
    expect(aiAllowanceInr(null, null)).toBe(AI_ALLOWANCE_FLOOR_INR);
  });

  it("never lets a full pass's AI cost more than the pass earns", () => {
    for (const p of Object.values(PLANS)) {
      const months = Math.max(1, p.days / 30);
      expect(aiAllowanceInr(p.paise, p.id) * months, p.id).toBeLessThanOrEqual(netRupees(p.paise));
    }
  });
});
