import { describe, expect, it } from "vitest";
import { AI_KINDS, costUsd, DAILY_LIMIT, monthStart, positiveNumber, tokenUses } from "./limits";

describe("AI spend limits (CO-1)", () => {
  it("every feature has a daily cap, and grading keeps the PRD's 5", () => {
    for (const k of AI_KINDS) expect(DAILY_LIMIT[k]).toBeGreaterThan(0);
    expect(DAILY_LIMIT.grade).toBe(5);
  });

  it("prices a call from its tokens", () => {
    expect(costUsd([{ model: "claude-opus-5-5", input: 1_000_000, output: 100_000 }])).toBe(6);
    expect(costUsd([{ model: "claude-haiku-5-5", input: 2000, output: 1000 }])).toBe(0.0007);
  });

  it("prices an unknown model at the worst case, never as free", () => {
    expect(costUsd([{ model: "some-new-model", input: 1_000_000, output: 0 }])).toBe(10);
  });

  it("bills each fallback attempt at its own model's price", () => {
    const uses = tokenUses(
      {
        input_tokens: 0,
        output_tokens: 0,
        iterations: [
          { input_tokens: 1000, output_tokens: 10, model: null },
          { input_tokens: 1000, output_tokens: 500, model: "claude-opus-4-8" },
        ],
      },
      "claude-opus-5-5",
    );
    expect(uses).toEqual([
      { model: "claude-opus-5-5", input: 1000, output: 10 },
      { model: "claude-opus-4-8", input: 1000, output: 500 },
    ]);
    expect(tokenUses({ input_tokens: 5, output_tokens: 7, iterations: null }, "m")).toEqual([{ model: "m", input: 5, output: 7 }]);
  });

  it("reads the monthly cap setting and the month start", () => {
    expect(positiveNumber("20", 5)).toBe(20);
    expect(positiveNumber("", 20)).toBe(20);
    expect(positiveNumber("abc", 20)).toBe(20);
    expect(positiveNumber("-1", 20)).toBe(20);
    expect(positiveNumber(undefined, 20)).toBe(20);
    expect(monthStart("2026-10-26")).toBe("2026-10-01");
  });
});
