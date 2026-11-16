import { describe, expect, it } from "vitest";
import { LIBRARY_START, isGoodToKnow, orderLibrary } from "./library-order";

const item = (key: string, goodToKnow = false) => ({ kind: key.split(":")[0], key, goodToKnow });

describe("LY-1: the Library lists technical lessons first", () => {
  it("starts at What automation is, even though other lessons come before it", () => {
    const items = [item("lesson:ai-and-jobs", true), item("lesson:python-for-production"), item(`lesson:${LIBRARY_START}`), item("lesson:rag-app")];
    expect(orderLibrary(items).map((i) => i.key)[0]).toBe(`lesson:${LIBRARY_START}`);
  });

  it("puts the good-to-know lessons after every technical one, keeping each group's own order", () => {
    const items = [
      item("lesson:ai-rules-india-abroad", true),
      item("lesson:bias-fairness", true),
      item("lesson:python-for-production"),
      item("lesson:company-ai-policy", true),
      item("lesson:rag-app"),
    ];
    expect(orderLibrary(items).map((i) => i.key)).toEqual([
      "lesson:python-for-production",
      "lesson:rag-app",
      "lesson:ai-rules-india-abroad",
      "lesson:bias-fairness",
      "lesson:company-ai-policy",
    ]);
  });

  it("orders each kind the same way and never drops or adds an item", () => {
    const items = [item("video:a", true), item("video:b"), item("skill:x", true), item("skill:y")];
    const out = orderLibrary(items);
    expect(out.map((i) => i.key)).toEqual(["video:b", "skill:y", "video:a", "skill:x"]);
    expect(out).toHaveLength(items.length);
  });

  it("does nothing to a list with nothing to move", () => {
    const items = [item("lesson:a"), item("lesson:b")];
    expect(orderLibrary(items)).toEqual(items);
  });
});

describe("isGoodToKnow", () => {
  it("is Beginner 1 awareness lessons only", () => {
    expect(isGoodToKnow({ level: "B1", theme: "governance" })).toBe(true);
    expect(isGoodToKnow({ level: "B1", theme: "using-ai" })).toBe(true);
    expect(isGoodToKnow({ level: "B1", theme: "automation" })).toBe(false); // What automation is stays up front
    expect(isGoodToKnow({ level: "P1", theme: "governance" })).toBe(false); // deeper governance lessons are technical work
  });
});
