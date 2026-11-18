import { describe, expect, it } from "vitest";
import { article, withArticle } from "./article";

describe("a or an before a role name (SE-12)", () => {
  it("says it as it sounds", () => {
    expect(withArticle("AI Engineer")).toBe("an AI Engineer");
    expect(withArticle("Agentic AI Engineer")).toBe("an Agentic AI Engineer");
    expect(withArticle("MLOps Engineer")).toBe("an MLOps Engineer");
    expect(withArticle("Machine Learning Engineer")).toBe("a Machine Learning Engineer");
    expect(withArticle("Generative AI & LLM Engineer")).toBe("a Generative AI & LLM Engineer");
    expect(withArticle("Forward Deployed Engineer (FDE)")).toBe("a Forward Deployed Engineer (FDE)");
    expect(article("user")).toBe("a");
  });
});
