import { describe, expect, it } from "vitest";
import { currentPathId, startFor, testHref } from "./paths";

const known = ["genai-engineer", "forward-deployed-engineer", "ai-for-beginners"];

describe("currentPathId", () => {
  it("prefers the chosen path, then the tested one, then the default", () => {
    expect(currentPathId(known, "ai-for-beginners", "forward-deployed-engineer")).toBe("ai-for-beginners");
    expect(currentPathId(known, null, "forward-deployed-engineer")).toBe("forward-deployed-engineer");
    expect(currentPathId(known)).toBe("genai-engineer");
  });

  it("ignores a path that no longer exists", () => {
    expect(currentPathId(known, "retired-path", "also-gone")).toBe("genai-engineer");
  });
});

describe("startFor", () => {
  it("uses the tested level only on a path with the level test", () => {
    expect(startFor({ placement: "ladder" }, "I2")).toBe("I2");
    expect(startFor({ placement: "none" }, "I2")).toBe("B1");
    expect(startFor({ placement: "ladder" }, null)).toBe("B1");
  });
});

describe("testHref", () => {
  it("keeps /start for the default path", () => {
    expect(testHref("genai-engineer")).toBe("/start");
    expect(testHref("forward-deployed-engineer")).toBe("/start/forward-deployed-engineer");
  });
});
