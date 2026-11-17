import { describe, expect, it } from "vitest";
import { pickForSetup, type Pickable } from "./setup";

const q = (id: string, level: string, kind: string, paths = ["genai-engineer"], topic = id.split("-")[0]): Pickable => ({
  id,
  question: `Question ${id}?`,
  short_answer: "",
  level,
  topic,
  paths,
  rubric: [],
  answer_seconds: 60,
  stop: { id: "s", title: "S" },
  kind,
});

const bank: Pickable[] = [
  q("a-1", "B1", "concept"),
  q("b-1", "B2", "scenario"),
  q("c-1", "I2", "concept"),
  q("d-1", "P1", "scenario"),
  q("e-1", "P2", "concept"),
  q("f-1", "P3", "use-case"),
  q("g-1", "P2", "concept", ["ml-engineer"]),
];

describe("picking questions for the setup (VI-11)", () => {
  it("keeps to the role, the experience level and the kind of questions when there are enough", () => {
    const got = pickForSetup(bank, { pathId: "genai-engineer", experience: "senior", style: "scenarios", count: 2, seed: 1 });
    expect(got.map((x) => x.id).sort()).toEqual(["d-1", "f-1"]);
  });

  it("widens to any kind, then nearby levels, then any level, so a narrow choice still gives a full interview", () => {
    const got = pickForSetup(bank, { pathId: "genai-engineer", experience: "senior", style: "scenarios", count: 6, seed: 1 });
    expect(got).toHaveLength(6);
    expect(new Set(got.map((x) => x.id)).size).toBe(6);
    // The exact matches come first.
    expect(got.slice(0, 2).map((x) => x.id).sort()).toEqual(["d-1", "f-1"]);
    expect(got.some((x) => x.id === "g-1")).toBe(false); // never another role's question
  });

  it("gives freshers beginner questions first", () => {
    const got = pickForSetup(bank, { pathId: null, experience: "fresher", style: "mixed", count: 2, seed: 3 });
    expect(got.map((x) => x.level).sort()).toEqual(["B1", "B2"]);
  });

  it("leaves out questions already chosen", () => {
    const got = pickForSetup(bank, { pathId: null, experience: null, style: "mixed", count: 10, seed: 3, exclude: ["a-1"] });
    expect(got.map((x) => x.id)).not.toContain("a-1");
    expect(got).toHaveLength(6);
  });

  it("is the same for the same seed", () => {
    const opts = { pathId: null, experience: "mid" as const, style: "mixed" as const, count: 3, seed: 42 };
    expect(pickForSetup(bank, opts)).toEqual(pickForSetup(bank, opts));
  });
});
