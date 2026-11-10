import { describe, expect, it } from "vitest";
import { clip, fitTitle, inSentence, pageMeta, roadmapTitles, titleCase } from "./seo";

describe("search titles (SE-3, SE-8)", () => {
  it("keeps the most descriptive variant that fits, and the brand only when it still fits", () => {
    expect(fitTitle(["AI Engineer Salary in India 2026 & AI Jobs for Freshers", "AI Jobs"])).toEqual({
      text: "AI Engineer Salary in India 2026 & AI Jobs for Freshers",
      brand: false,
    });
    expect(fitTitle(["Free AI Tutor for Learning AI"])).toEqual({ text: "Free AI Tutor for Learning AI", brand: true });
  });

  it("clips the last variant when none fits", () => {
    const long = "x ".repeat(50).trim();
    const { text, brand } = fitTitle([long]);
    expect(text.length).toBeLessThanOrEqual(60);
    expect(brand).toBe(false);
  });

  it("never gives a title over 60 characters for any role roadmap", () => {
    for (const name of ["AI Engineer", "AI Governance & Compliance Specialist", "Forward Deployed Engineer (FDE)"]) {
      const { text, brand } = fitTitle(roadmapTitles(name, "2026"));
      expect(text.length + (brand ? " | Xplaind".length : 0)).toBeLessThanOrEqual(60);
      expect(text).toContain(name);
    }
  });

  it("title-cases topic names but leaves small words and acronyms", () => {
    expect(titleCase("Data structures and algorithms")).toBe("Data Structures and Algorithms");
    expect(titleCase("Retrieval and RAG")).toBe("Retrieval and RAG");
    expect(titleCase("AI basics")).toBe("AI Basics");
    expect(inSentence("Data structures and algorithms")).toBe("data structures and algorithms");
    expect(inSentence("AI basics")).toBe("AI basics");
  });

  it("pageMeta clips the description and shares the fullest title", () => {
    const m = pageMeta({ title: ["A very descriptive page title that is long", "Short"], description: "word ".repeat(60), path: "/x" });
    expect(String(m.description).length).toBeLessThanOrEqual(155);
    expect(m.openGraph?.title).toBe("A very descriptive page title that is long");
    expect(m.alternates?.canonical).toBe("/x");
    expect(clip("short")).toBe("short");
  });
});
