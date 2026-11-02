import { describe, expect, it } from "vitest";
import { parsePlan } from "./plan-store";

describe("plan store (WP-2)", () => {
  it("reads a saved plan and refuses anything malformed", () => {
    const ok = { week: "2026-11-02", pathId: "ai-engineer", hours: 6, lessonIds: ["python-basics"] };
    expect(parsePlan(JSON.stringify(ok))).toEqual(ok);
    expect(parsePlan(null)).toBeNull();
    expect(parsePlan("{not json")).toBeNull();
    expect(parsePlan(JSON.stringify({ ...ok, hours: 999 }))).toBeNull();
    expect(parsePlan(JSON.stringify({ ...ok, pathId: "../evil" }))).toBeNull();
  });
});
