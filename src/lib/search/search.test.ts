import { describe, expect, it } from "vitest";
import { type SearchItem, search } from "./search";

const items: SearchItem[] = [
  { k: "lesson", t: "Build a RAG app", h: "/stop/rag-app", s: "retrieval augmented generation" },
  { k: "path", t: "RAG Expert", h: "/roadmap/rag-expert" },
  { k: "question", t: "What is RAG, and why would you use it?", h: "/interview/what-is-rag" },
  { k: "term", t: "Drag and drop", h: "/glossary#x" },
  { k: "course", t: "Python Basics", h: "/go/py", s: "Kaggle" },
];

describe("search", () => {
  it("ranks whole-word title matches first and roadmaps before lessons on ties", () => {
    expect(search(items, "rag").map((i) => i.k)).toEqual(["path", "lesson", "question", "term"]);
  });
  it("needs every word, and matches the subtitle too", () => {
    expect(search(items, "rag expert").map((i) => i.t)).toEqual(["RAG Expert"]);
    expect(search(items, "kaggle").map((i) => i.t)).toEqual(["Python Basics"]);
    expect(search(items, "   ")).toEqual([]);
  });
});
