import { describe, expect, it } from "vitest";
import {
  type SimQuestion,
  analyseAnswer,
  countFillers,
  coverage,
  delivery,
  findKeyword,
  normalise,
  pickQuestions,
  sessionReport,
} from "./analyse";

const q = (o: Partial<SimQuestion> = {}): SimQuestion => ({
  id: "what-is-rag",
  question: "What is RAG?",
  short_answer: "Retrieve, then answer.",
  level: "I2",
  topic: "rag",
  paths: ["genai-engineer"],
  rubric: [
    { point: "Retrieves relevant text", keywords: ["retriev", "search"] },
    { point: "Grounds the answer", keywords: ["ground", "context"] },
    { point: "Cites sources", keywords: ["cite", "source"] },
    { point: "Handles fine-tuning trade-off", keywords: ["fine-tun"] },
  ],
  answer_seconds: 60,
  stop: { id: "rag-app", title: "Build a RAG app" },
  ...o,
});

describe("findKeyword", () => {
  it("matches at the start of a word, not inside one", () => {
    const text = normalise("We retrieved the docs and dragged them in.");
    expect(findKeyword(text, "retriev")).toBe(true);
    expect(findKeyword(text, "rag")).toBe(false);
  });

  it("treats hyphens, case and punctuation alike", () => {
    expect(findKeyword(normalise("Fine tuning, then RAG."), "fine-tun")).toBe(true);
    expect(findKeyword(normalise("FINE-TUNING!"), "fine tun")).toBe(true);
    expect(findKeyword(normalise("I don’t know"), "don't know")).toBe(true);
  });
});

describe("coverage and scoring (VS-1)", () => {
  it("marks each rubric point and the keyword that matched", () => {
    const points = coverage("First we search the documents, then answer from that context.", q().rubric);
    expect(points.map((p) => p.covered)).toEqual([true, true, false, false]);
    expect(points[0].matched).toBe("search");
  });

  it("scores the share of points covered out of 5", () => {
    expect(analyseAnswer(q(), "We retrieve, ground in context, cite the source and avoid fine-tuning.", 40).score).toBe(5);
    expect(analyseAnswer(q(), "We retrieve documents.", 10).score).toBe(1);
    expect(analyseAnswer(q(), "", 0).score).toBe(0);
  });
});

describe("delivery", () => {
  const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");

  it("judges length against the time limit", () => {
    expect(delivery("", 0, 60).length).toBe("empty");
    expect(delivery(words(10), 8, 60).length).toBe("short");
    expect(delivery(words(120), 50, 60).length).toBe("good");
    expect(delivery(words(160), 60, 60).length).toBe("ran-out");
  });

  it("computes words per minute only when there is enough to judge", () => {
    expect(delivery(words(120), 60, 90).wordsPerMinute).toBe(120);
    expect(delivery(words(5), 30, 60).wordsPerMinute).toBeNull();
  });

  it("counts filler words and phrases as whole words", () => {
    const f = countFillers("Um, so basically, you know, it is, um, kind of like a search. Umbrella.");
    expect(f.total).toBe(5);
    expect(f.top[0]).toEqual({ word: "um", count: 2 });
  });
});

describe("sessionReport", () => {
  it("summarises scores and lists the top three fixes, content and delivery", () => {
    const qs = [q(), q({ id: "b", question: "B?" }), q({ id: "c", question: "C?" })];
    const results = [
      analyseAnswer(qs[0], "We retrieve, ground in context, cite the source and avoid fine-tuning.", 30),
      analyseAnswer(qs[1], "We search.", 5),
      analyseAnswer(qs[2], "", 0),
    ];
    const r = sessionReport(qs, results);
    expect(r.answered).toBe(2);
    expect(r.averageScore).toBe(2);
    expect(r.coveredPoints).toBe(5);
    expect(r.totalPoints).toBe(12);
    expect(r.fixes).toHaveLength(3);
    expect(r.fixes[0].kind).toBe("delivery");
    expect(r.fixes.some((f) => f.questionId === "b" && f.text.includes("Grounds the answer"))).toBe(true);
  });
});

describe("pickQuestions", () => {
  const pool = [
    q({ id: "r1", topic: "rag" }),
    q({ id: "r2", topic: "rag" }),
    q({ id: "a1", topic: "agents" }),
    q({ id: "e1", topic: "evals", paths: ["ml-engineer"] }),
  ];

  it("filters by path and spreads across topics", () => {
    const picked = pickQuestions(pool, { pathId: "genai-engineer", count: 2, seed: 1 });
    expect(picked).toHaveLength(2);
    expect(new Set(picked.map((p) => p.topic)).size).toBe(2);
    expect(picked.every((p) => p.paths.includes("genai-engineer"))).toBe(true);
  });

  it("is reproducible from the seed and never repeats a question", () => {
    const a = pickQuestions(pool, { pathId: null, count: 4, seed: 7 }).map((p) => p.id);
    expect(pickQuestions(pool, { pathId: null, count: 4, seed: 7 }).map((p) => p.id)).toEqual(a);
    expect(new Set(a).size).toBe(4);
  });
});
