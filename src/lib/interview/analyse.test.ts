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
  referenceMatch,
  sessionReport,
  structure,
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

describe("understanding analysis", () => {
  const rag = q({
    short_answer: "RAG retrieves relevant passages from your documents and gives them to the model as context, so answers are grounded and cite sources.",
    deeper_answer: "Retrieval finds chunks by embedding search; the model answers only from the retrieved context and cites each passage. It is cheaper to update than fine-tuning.",
  });

  it("quotes the learner's own sentence as evidence for a covered point", () => {
    const r = analyseAnswer(rag, "RAG is a pattern. First we search the documents for relevant chunks. Then the model answers.", 30);
    expect(r.points[0]).toMatchObject({ covered: true, evidence: "First we search the documents for relevant chunks." });
  });

  it("measures closeness to the reference without crediting the question's own words", () => {
    const m = referenceMatch("We embed chunks, search them, and the model cites the retrieved passages.", rag.short_answer + " " + rag.deeper_answer!, rag.question);
    expect(m.score).toBeGreaterThan(0.3);
    expect(m.matched).toEqual(expect.arrayContaining(["retrieves", "passages"]));
    expect(referenceMatch("What is RAG? RAG.", rag.short_answer, rag.question).score).toBe(0);
  });

  it("spots a definition, an example, a trade-off and real use", () => {
    expect(structure("RAG is a way to ground answers. For example, a bank's policy bot. But it adds latency, so we measure it in production.")).toEqual({
      definition: true,
      example: true,
      tradeoff: true,
      practice: true,
    });
    expect(structure("Search stuff.")).toEqual({ definition: false, example: false, tradeoff: false, practice: false });
  });

  it("bands a strong, a partial and a missing answer", () => {
    const strong = analyseAnswer(
      rag,
      "RAG is retrieval-augmented generation. We search the documents, ground the model in that context and cite every source. For example a policy bot. But unlike fine-tuning it is cheap to update.",
      50,
    );
    expect(strong.band).toBe("strong");
    expect(analyseAnswer(rag, "It searches documents somehow and that is about it really.", 20).band).toMatch(/partial|weak/);
    expect(analyseAnswer(rag, "", 0)).toMatchObject({ band: "none", understanding: 0 });
  });

  it("groups the session into concepts, strongest first, with lessons to revisit", () => {
    const other = q({ id: "evals", topic: "evals", stop: { id: "evals-test-sets", title: "Evals" } });
    const results = [analyseAnswer(rag, "We search, ground in context and cite the source, unlike fine-tuning.", 40), analyseAnswer(other, "No idea.", 5)];
    const report = sessionReport([rag, other], results);
    expect(report.concepts.map((c) => c.topic)).toEqual(["rag", "evals"]);
    expect(report.concepts[1].lessons).toEqual([{ id: "evals-test-sets", title: "Evals" }]);
    expect(report.understanding).toBe(Math.round((results[0].understanding + results[1].understanding) / 2));
  });
});
