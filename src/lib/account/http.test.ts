import { describe, expect, it } from "vitest";
import { safeNext } from "./http";

describe("safeNext", () => {
  it("allows same-site paths only", () => {
    expect(safeNext("/stop/what-is-ai")).toBe("/stop/what-is-ai");
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("/\\evil.example")).toBe("/");
    expect(safeNext(null)).toBe("/");
  });
});
