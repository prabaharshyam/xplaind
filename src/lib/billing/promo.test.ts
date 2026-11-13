import { describe, expect, it } from "vitest";
import { rupees } from "./plans";
import { checkPromo, discountedPaise, normaliseCode } from "./promo";

describe("promo codes (PAY-9)", () => {
  it("accepts a code in any case and spacing, and refuses anything that cannot be a code", () => {
    expect(normaliseCode("  XP50off ")).toBe("xp50off");
    expect(normaliseCode("x")).toBeNull();
    expect(normaliseCode("drop table;")).toBeNull();
    expect(normaliseCode(42)).toBeNull();
  });

  it("prices 100, 50, 25 and 10 percent off the ₹249 pass in whole paise", () => {
    expect(discountedPaise(24_900, 100)).toBe(0);
    expect(discountedPaise(24_900, 50)).toBe(12_450);
    expect(discountedPaise(24_900, 25)).toBe(18_675);
    expect(discountedPaise(24_900, 10)).toBe(22_410);
    expect(discountedPaise(24_900, 0)).toBe(24_900);
    expect([12_450, 18_675, 22_410, 149_900].map(rupees)).toEqual(["₹124.50", "₹186.75", "₹224.10", "₹1,499"]);
  });
});

/** A fake service client: the code row and whether this account already used it. */
function admin(promo: Record<string, unknown> | null, used = false) {
  const table = (name: string) => {
    const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: name === "promo_codes" ? promo : used ? { code: "x" } : null }) };
    return chain;
  };
  return { from: table } as never;
}

describe("checkPromo (PAY-9)", () => {
  const row = { code: "xp50off", percent_off: 50, plan_ids: ["pass_month"], active: true, expires_at: null };
  const U = "user-1";

  it("allows an active code on the 30-day pass for an account that has not used it", async () => {
    expect(await checkPromo(admin(row), "XP50OFF", "pass_month", U)).toEqual({ ok: true, code: "xp50off", percentOff: 50 });
  });

  it("refuses unknown, switched-off, expired, used, or other-pass codes", async () => {
    expect((await checkPromo(admin(null), "nope", "pass_month", U)).ok).toBe(false);
    expect((await checkPromo(admin({ ...row, active: false }), "xp50off", "pass_month", U)).ok).toBe(false);
    expect(await checkPromo(admin({ ...row, expires_at: "2026-01-01T00:00:00Z" }), "xp50off", "pass_month", U, new Date("2026-11-13"))).toMatchObject({ ok: false, reason: /expired/ });
    expect(await checkPromo(admin(row, true), "xp50off", "pass_month", U)).toMatchObject({ ok: false, reason: /already used/ });
    expect(await checkPromo(admin(row), "xp50off", "pass_year", U)).toMatchObject({ ok: false, reason: /30-day pass/ });
  });
});
