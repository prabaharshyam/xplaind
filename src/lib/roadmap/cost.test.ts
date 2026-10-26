import { describe, expect, it } from "vitest";
import { costLabel, formatDay } from "./cost";

describe("costLabel (RM-6)", () => {
  it("labels free and free-to-learn resources", () => {
    expect(costLabel({ cost: "free" })).toEqual({ label: "Free" });
    expect(costLabel({ cost: "free_cert_paid" })).toEqual({ label: "Free to learn, paid certificate" });
  });

  it("shows a rupee price with its check date", () => {
    expect(costLabel({ cost: "paid", price_inr: 449, price_checked_on: "2026-10-01" }, "2026-10-25")).toEqual({
      label: "₹449",
      note: "price checked on 1 Oct 2026",
    });
    expect(costLabel({ cost: "free_cert_paid", price_inr: 3999, price_checked_on: "2026-10-01" }).label).toBe(
      "Free to learn, certificate ₹3,999",
    );
  });

  it("says the price may have changed after 60 days", () => {
    const r = { cost: "paid" as const, price_inr: 449, price_checked_on: "2026-08-01" };
    expect(costLabel(r, "2026-09-30").note).toBe("price checked on 1 Aug 2026"); // 60 days
    expect(costLabel(r, "2026-10-01").note).toBe("price checked on 1 Aug 2026; price may have changed"); // 61 days
  });

  it("never shows a price without its check date", () => {
    for (const r of [
      { cost: "paid" as const, price_inr: 449 },
      { cost: "paid" as const },
      { cost: "free_cert_paid" as const, price_inr: 999 },
    ]) {
      const { label, note } = costLabel(r, "2026-10-25");
      expect(label).not.toMatch(/₹|\d/);
      expect(note).toBe("price not checked yet");
    }
  });

  it("formats dates without shifting the day", () => {
    expect(formatDay("2026-01-01")).toBe("1 Jan 2026");
    expect(formatDay("2026-12-31")).toBe("31 Dec 2026");
  });
});
