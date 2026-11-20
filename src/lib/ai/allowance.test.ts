import { describe, expect, it } from "vitest";
import { windowStart } from "./allowance";

describe("the Pro AI allowance window (PAY-13)", () => {
  it("covers the 30 days ending today, across month ends", () => {
    expect(windowStart("2026-11-30")).toBe("2026-11-01");
    expect(windowStart("2026-12-05")).toBe("2026-11-06");
  });
});
