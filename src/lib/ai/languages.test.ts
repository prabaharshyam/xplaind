import { describe, expect, it } from "vitest";
import { isLanguageId, LANGUAGE_IDS, languageRule } from "./languages";

describe("IL-1 tutor languages", () => {
  it("adds nothing for English", () => {
    expect(languageRule("en")).toBe("");
  });
  it("asks for the language in its own script and keeps technical terms in English", () => {
    const rule = languageRule("ta");
    expect(rule).toContain("Tamil");
    expect(rule).toContain("தமிழ்");
    expect(rule).toContain("in English");
  });
  it("writes Hinglish in English letters", () => {
    expect(languageRule("hinglish")).toContain("English letters");
  });
  it("knows only the listed languages", () => {
    expect(LANGUAGE_IDS).toContain("hi");
    expect(isLanguageId("hi")).toBe(true);
    expect(isLanguageId("fr")).toBe(false);
    expect(isLanguageId(3)).toBe(false);
  });
});

describe("IL-1 in the tutor prompt", async () => {
  const { tutorPrompt, TutorRequest } = await import("./features");
  const turns = [{ role: "user" as const, text: "What is RAG?" }];
  it("adds the language rule only when a language other than English is chosen", () => {
    expect(tutorPrompt(null, { turns, language: "hi" }, []).system).toContain("Hindi");
    expect(tutorPrompt(null, { turns }, []).system).not.toContain("Reply in");
  });
  it("defaults to English and refuses unknown languages", () => {
    expect(TutorRequest.parse({ turns }).language).toBe("en");
    expect(TutorRequest.safeParse({ turns, language: "fr" }).success).toBe(false);
  });
});
