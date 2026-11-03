import { describe, expect, it } from "vitest";
import { LEVEL_IDS, levelText, levelWords } from "./levels";

describe("levelWords", () => {
  it("names every level in words", () => {
    expect(LEVEL_IDS.map(levelWords)).toEqual([
      "Beginner 1", "Beginner 2", "Beginner 3",
      "Intermediate 1", "Intermediate 2", "Intermediate 3",
      "Pro 1", "Pro 2", "Pro 3",
    ]);
  });
});

describe("levelText", () => {
  it("names level ids and leaves other text alone", () => {
    expect(levelText("I2")).toBe("Intermediate 2");
    expect(levelText("All levels")).toBe("All levels");
  });
});
