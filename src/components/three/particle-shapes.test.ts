import { describe, expect, it } from "vitest";
import { THEMES } from "@/lib/themes";
import { SHAPE_NAMES, THEME_SHAPE, extrude, galaxy, sculpture } from "./particle-shapes";

describe("particle sculptures (MO-8)", () => {
  it.each(SHAPE_NAMES)("%s gives the asked number of finite points inside the unit sphere", (name) => {
    const p = sculpture(name, 2000);
    expect(p.length).toBe(6000);
    let far = 0;
    for (let i = 0; i < 2000; i++) {
      const [x, y, z] = [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]];
      expect(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)).toBe(true);
      far = Math.max(far, Math.hypot(x, y, z));
    }
    expect(far).toBeLessThanOrEqual(1.0001);
    expect(far).toBeGreaterThan(0.99);
  });

  it("is the same on every visit", () => {
    expect(sculpture("trophy", 100)).toEqual(sculpture("trophy", 100));
  });

  it("every topic has a shape", () => {
    for (const t of THEMES) expect(THEME_SHAPE[t.id]).toBeTruthy();
  });

  it("gives an icon depth and starts particles in a galaxy around the shape", () => {
    const flat = new Float32Array([-1, -1, 1, 1, 0, 0]);
    const p = extrude(flat, 300);
    expect(p.length).toBe(900);
    const g = galaxy(500);
    for (let i = 0; i < 500; i++) expect(Math.hypot(g[i * 3], g[i * 3 + 2])).toBeGreaterThan(1.3);
  });
});
