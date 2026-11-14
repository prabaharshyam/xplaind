import { describe, expect, it } from "vitest";
import { isBrowserEvent } from "@/lib/funnel";
import { PLANS, perDay } from "./plans";
import { makeRefCode, normaliseRefCode, referralFor } from "./referral";

describe("referral codes (RF-1)", () => {
  it("normalises what people type and refuses anything else", () => {
    expect(normaliseRefCode(" AbCd2345 ")).toBe("abcd2345");
    expect(normaliseRefCode("abc")).toBeNull();
    expect(normaliseRefCode("drop;table")).toBeNull();
    expect(normaliseRefCode(7)).toBeNull();
  });

  it("makes 8-character codes without look-alike characters", () => {
    const code = makeRefCode(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[a-km-np-z2-9]+$/);
    expect(normaliseRefCode(code)).toBe(code);
  });
});

/** A fake service client: the code's owner and how many paid passes the buyer has. */
function admin(owner: string | null, paid: number) {
  const chain = (table: string) => {
    const c = {
      select: () => c,
      eq: () => c,
      maybeSingle: async () => ({ data: table === "referral_codes" && owner ? { user_id: owner } : null }),
      then: (res: (v: { count: number }) => unknown) => Promise.resolve({ count: paid }).then(res),
    };
    return c;
  };
  return { from: chain } as never;
}

describe("who gets the friend discount (RF-1)", () => {
  it("only a first pass, only with someone else's code", async () => {
    expect(await referralFor(admin("friend", 0), "abcd2345", "me")).toEqual({ referrer: "friend" });
    expect(await referralFor(admin("me", 0), "abcd2345", "me")).toBeNull();
    expect(await referralFor(admin("friend", 1), "abcd2345", "me")).toBeNull();
    expect(await referralFor(admin(null, 0), "abcd2345", "me")).toBeNull();
    expect(await referralFor(admin("friend", 0), undefined, "me")).toBeNull();
  });
});

describe("week pass and funnel (PAY-11, AN-1)", () => {
  it("prices the week pass at ₹99 for 7 days, dearer per day than the longer passes", () => {
    expect(PLANS.pass_week).toMatchObject({ paise: 9_900, days: 7 });
    expect(perDay(PLANS.pass_week)).toBe("₹14");
    expect(PLANS.pass_week.paise / PLANS.pass_week.days).toBeGreaterThan(PLANS.pass_month.paise / PLANS.pass_month.days);
  });

  it("lets the browser report only first lessons and pricing views", () => {
    expect(isBrowserEvent("pricing_view")).toBe(true);
    expect(isBrowserEvent("first_lesson")).toBe(true);
    expect(isBrowserEvent("purchase")).toBe(false);
    expect(isBrowserEvent("anything")).toBe(false);
  });
});
