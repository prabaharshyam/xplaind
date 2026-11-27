import { describe, expect, it } from "vitest";
import { APP_SCRIPT, frameFor } from "./app-frame";

describe("APP-1 frames", () => {
  it("gives visitors the website everywhere", () => {
    for (const p of ["/", "/paths", "/stop/rag-app", "/ai/book", "/dashboard"]) expect(frameFor(p, false)).toBe("website");
  });
  it("gives a signed-in learner the app on product pages and the website on marketing pages", () => {
    for (const p of ["/dashboard", "/paths", "/roadmap/ai-engineer", "/stop/rag-app", "/practice", "/interview", "/interview/simulator", "/interview/prep", "/ai", "/ai/book", "/plan", "/playground", "/jobs", "/settings", "/library", "/start"]) {
      expect(frameFor(p, true), p).toBe("app");
    }
    for (const p of ["/", "/pricing", "/about", "/blog", "/blog/how-to-learn-ai", "/interview/for/ai-engineer", "/u/someone", "/certificate/x", "/privacy", "/signin", "/aiml"]) {
      expect(frameFor(p, true), p).toBe("website");
    }
  });
  it("ships a pre-paint script with the same lists", () => {
    expect(APP_SCRIPT).toContain('"/dashboard"');
    expect(APP_SCRIPT).toContain('"/interview/for"');
    expect(() => new Function(APP_SCRIPT)).not.toThrow();
  });
});
