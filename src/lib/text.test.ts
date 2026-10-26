import { describe, expect, it } from "vitest";
import { splitStem, tagLabel } from "./text";

describe("tagLabel", () => {
  it("turns a tag into a readable label", () => {
    expect(tagLabel("python-data-structures")).toBe("Python data structures");
    expect(tagLabel("evals")).toBe("Evals");
    expect(tagLabel("llm-basics")).toBe("LLM basics");
    expect(tagLabel("ai-safety")).toBe("AI safety");
    expect(tagLabel("web-apis")).toBe("Web APIs");
  });
});

describe("splitStem", () => {
  it("keeps a plain question as text", () => {
    expect(splitStem("What is a token?")).toEqual({ text: "What is a token?" });
  });
  it("splits question text from a code block", () => {
    expect(splitStem("What does this print?\n\nfor i in range(3):\n    print(i)")).toEqual({
      text: "What does this print?",
      code: "for i in range(3):\n    print(i)",
    });
  });
  it("keeps blank lines inside the code", () => {
    expect(splitStem("Q?\n\ndef f():\n    pass\n\nprint(f())").code).toBe("def f():\n    pass\n\nprint(f())");
  });
});
