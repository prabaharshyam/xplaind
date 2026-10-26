import { describe, expect, it } from "vitest";
import { getPaths, getStop } from "./index";
import { roadmapModel } from "./roadmap";
import { roadmapStopIds } from "@/lib/roadmap/view";

describe("roadmapModel (RM-1): one shape for every path", () => {
  it("builds a section per level or stage, with only real lessons linked", () => {
    for (const path of getPaths()) {
      const m = roadmapModel(path);
      expect(m.sections.length, path.id).toBe(path.stages.length);
      for (const s of m.sections) {
        expect(s.topics.length, `${path.id}/${s.id}`).toBeGreaterThan(0);
        for (const t of s.topics) if (t.stopId) expect(getStop(t.stopId), t.stopId).toBeDefined();
      }
      const keys = m.sections.flatMap((s) => s.topics.map((t) => t.key));
      expect(new Set(keys).size, path.id).toBe(keys.length);
      expect(roadmapStopIds(m).length, path.id).toBe(new Set(path.stages.flatMap((st) => st.lessons)).size);
    }
  });

  it("marks GenAI sections with their level, level page and level project", () => {
    const genai = roadmapModel(getPaths().find((p) => p.id === "genai-engineer")!);
    expect(genai.sections.map((s) => s.code)).toEqual(["B1", "B2", "B3", "I1", "I2", "I3", "P1", "P2", "P3"]);
    expect(genai.sections[0].href).toBe("/roadmap/genai-engineer/b1");
    expect(genai.sections.every((s) => s.project !== null)).toBe(true);
    expect(genai.sections.some((s) => s.topics.some((t) => t.stopId === null))).toBe(true); // coming soon
  });

  it("numbers stage sections and keeps their projects", () => {
    const fde = roadmapModel(getPaths().find((p) => p.id === "forward-deployed-engineer")!);
    expect(fde.sections[0].code).toBe("1");
    expect(fde.sections[0].href).toBeNull();
    expect(fde.sections[0].project?.deliverables.length).toBeGreaterThan(0);
  });
});
