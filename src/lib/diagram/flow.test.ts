import { describe, expect, it } from "vitest";
import { FlowError, describeFlow, layoutFlow, parseFlow, wrap } from "./flow";

const SRC = `title: Retry
# a comment
Call the API -> Success?
Success? -[yes]-> Use the result | log tokens and cost
Success? -[no]-> Retryable? -[no]-> Fail fast
Retryable? -[yes]-> Wait, then call again -> Call the API`;

describe("lesson diagrams (RM-14)", () => {
  it("reads steps, notes, decisions, chains and labels", () => {
    const f = parseFlow(SRC);
    expect(f.title).toBe("Retry");
    expect(f.dir).toBe("TB");
    expect(f.nodes.map((n) => n.id)).toEqual(["Call the API", "Success?", "Use the result", "Retryable?", "Fail fast", "Wait, then call again"]);
    expect(f.nodes.find((n) => n.id === "Success?")!.decision).toBe(true);
    expect(f.nodes.find((n) => n.id === "Use the result")!.note).toBe("log tokens and cost");
    expect(f.edges).toHaveLength(6);
    expect(f.edges[1]).toEqual({ from: "Success?", to: "Use the result", label: "yes" });
  });

  it("refuses diagrams that would not draw well", () => {
    expect(() => parseFlow("Only one")).toThrow(FlowError);
    expect(() => parseFlow("dir: sideways\nA -> B")).toThrow(/LR or TB/);
    expect(() => parseFlow(`A -> ${"x".repeat(90)}`)).toThrow(/too long/);
    expect(() => parseFlow("A | one -> B\nA | two -> C")).toThrow(/two different notes/);
  });

  it("lays every step out without overlaps, left to right too", () => {
    for (const dir of ["TB", "LR"] as const) {
      const l = layoutFlow(parseFlow(SRC), dir);
      expect(l.width).toBeGreaterThan(0);
      expect(l.nodes).toHaveLength(6);
      for (const a of l.nodes)
        for (const b of l.nodes)
          if (a !== b) expect(Math.abs(a.x - b.x) * 2 >= a.w + b.w - 1 || Math.abs(a.y - b.y) * 2 >= a.h + b.h - 1).toBe(true);
      expect(l.edges.every((e) => e.points.length >= 2)).toBe(true);
    }
  });

  it("wraps long text and describes the diagram in words", () => {
    expect(wrap("one two three four five", 9)).toEqual(["one two", "three", "four five"]);
    const words = describeFlow(parseFlow(SRC));
    expect(words[1]).toBe("Success? → yes → Use the result (log tokens and cost)");
  });
});
