import { describe, expect, it } from "vitest";
import { getPaths, getProjects } from "@/lib/content";
import { THEMES } from "@/lib/themes";
import { PROJECT_SCENES, ROLE_SCENES, THEME_SCENES, orbit, sceneFor } from "./line-art";

// BR-4: every role, topic and project has its own line scene, and the layout stays on the canvas.
describe("line scenes", () => {
  it("has a scene for every topic", () => {
    for (const t of THEMES) expect(THEME_SCENES[t.id], t.id).toBeDefined();
  });

  it("has a scene for every role roadmap", () => {
    for (const p of getPaths()) expect(ROLE_SCENES[p.id], p.id).toBeDefined();
  });

  it("has a scene for every guided project", () => {
    for (const p of getProjects()) expect(PROJECT_SCENES[p.id], p.id).toBeDefined();
  });

  it("prefers a role or project scene, then the topic's, then a safe default", () => {
    expect(sceneFor("ai-engineer", "llm")).toBe(ROLE_SCENES["ai-engineer"]);
    expect(sceneFor("first-llm-app", "llm")).toBe(PROJECT_SCENES["first-llm-app"]);
    expect(sceneFor("topic-agents", "agents")).toBe(THEME_SCENES.agents);
    expect(sceneFor("x", "nope")).toBe(THEME_SCENES["ai-basics"]);
  });

  it("keeps every glyph inside the 300 by 110 canvas", () => {
    for (let n = 1; n <= 4; n++) {
      for (const p of orbit(n)) {
        expect(p.x).toBeGreaterThan(30);
        expect(p.x).toBeLessThan(270);
        expect(p.y).toBeGreaterThan(24);
        expect(p.y).toBeLessThan(96);
      }
    }
  });

  it("uses no more than a hero and four around it", () => {
    for (const s of [...Object.values(THEME_SCENES), ...Object.values(ROLE_SCENES), ...Object.values(PROJECT_SCENES)]) expect(s.length).toBeLessThanOrEqual(5);
  });
});
