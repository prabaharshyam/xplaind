import { describe, expect, it } from "vitest";
import { cleanGrade, cleanCourseLesson, chatMessages, knownIds } from "./features";
import { addTopic, cleanRoadmap, type ModelRoadmap, moveTopic, removeTopic, renameTopic, RoadmapShape, toModelShape, totalHours } from "./roadmap";

const topic = (title: string, lesson_id: string | null = null) => ({ title, why: "because", subtopics: ["a", "b"], hours: 3, lesson_id });
const raw: ModelRoadmap = {
  title: "  Become a   RAG engineer ",
  summary: "Plan",
  stages: [
    { title: "Basics", weeks: 2.4, goal: "g", topics: [topic("Python", "python-basics"), topic("LLMs", "made-up-id")] },
    { title: "Empty", weeks: 1, goal: "g", topics: [] },
    { title: "Build", weeks: 99, goal: "g", topics: [topic("RAG"), { ...topic("Evals"), hours: -4 }] },
  ],
  project: { title: "A bot", description: "d" },
  tips: ["one", "", "two"],
};
const known = new Set(["python-basics"]);

describe("cleanRoadmap", () => {
  const r = cleanRoadmap(raw, known);

  it("keeps lesson links only for lessons that exist", () => {
    expect(r.stages[0].topics.map((t) => t.lessonId)).toEqual(["python-basics", null]);
  });

  it("drops empty stages, tidies text, and keeps numbers in range", () => {
    expect(r.title).toBe("Become a RAG engineer");
    expect(r.stages.map((s) => s.title)).toEqual(["Basics", "Build"]);
    expect(r.stages.map((s) => s.weeks)).toEqual([2, 52]);
    expect(r.stages[1].topics[1].hours).toBe(1);
    expect(r.tips).toEqual(["one", "two"]);
  });

  it("gives stable ids and passes the browser-side shape check", () => {
    expect(r.stages[1].topics.map((t) => t.id)).toEqual(["s3t1", "s3t2"]);
    expect(RoadmapShape.safeParse(r).success).toBe(true);
  });

  it("caps counts even when the model returns too much", () => {
    const big = { ...raw, stages: Array.from({ length: 20 }, () => ({ title: "S", weeks: 1, goal: "", topics: Array.from({ length: 30 }, () => topic("T")) })) };
    const c = cleanRoadmap(big, known);
    expect(c.stages).toHaveLength(8);
    expect(c.stages[0].topics).toHaveLength(10);
  });

  it("round-trips to the model's shape for a refine request", () => {
    expect(toModelShape(r).stages[0].topics[0].lesson_id).toBe("python-basics");
  });
});

describe("roadmap editing", () => {
  const r = cleanRoadmap(raw, known);

  it("moves a topic within its stage and ignores moves past the ends", () => {
    expect(moveTopic(r, "s1t2", -1).stages[0].topics.map((t) => t.title)).toEqual(["LLMs", "Python"]);
    expect(moveTopic(r, "s1t1", -1)).toEqual(r);
  });

  it("removes a topic, and the stage when it empties", () => {
    const one = removeTopic(removeTopic(r, "s1t1"), "s1t2");
    expect(one.stages.map((s) => s.id)).toEqual(["s3"]);
  });

  it("renames and adds topics, ignoring blank text", () => {
    expect(renameTopic(r, "s1t1", "  Python for AI ").stages[0].topics[0].title).toBe("Python for AI");
    expect(renameTopic(r, "s1t1", "   ")).toEqual(r);
    const added = addTopic(r, "s1", "Git");
    expect(added.stages[0].topics.at(-1)).toMatchObject({ id: "s1t3", title: "Git", lessonId: null });
    expect(totalHours(added)).toBe(totalHours(r) + 2);
  });
});

describe("other AI clean-up", () => {
  it("keeps a grade between 0 and 5 and rubric lists to real points", () => {
    const g = cleanGrade({ score: 9, verdict: "v", covered: ["a", "invented"], missing: ["b"], feedback: "f", stronger_answer: "s" }, [{ point: "a" }, { point: "b" }]);
    expect(g.score).toBe(5);
    expect(g.covered).toEqual(["a"]);
    expect(cleanGrade({ ...g, score: Number.NaN }, []).score).toBe(0);
  });

  it("drops quiz questions whose answer is not one of the options", () => {
    const l = cleanCourseLesson({
      title: "t",
      intro: "i",
      sections: [{ heading: "h", body: "b" }],
      diagram: "\n[a] --> [b]\n",
      example: { title: "e", body: "b" },
      key_points: ["k"],
      quiz: [
        { question: "q1", options: ["a", "b"], answer_index: 1, explanation: "x" },
        { question: "q2", options: ["a", "b"], answer_index: 4, explanation: "x" },
      ],
      flashcards: [{ q: "q", a: "a" }],
    });
    expect(l.quiz.map((q) => q.question)).toEqual(["q1"]);
    expect(l.diagram).toBe("[a] --> [b]");
  });

  it("starts a chat on a learner turn and wraps learner turns as data", () => {
    const m = chatMessages([
      { role: "assistant", text: "Hi" },
      { role: "user", text: "What is RAG?" },
      { role: "assistant", text: "Retrieval..." },
    ]);
    expect(m[0].role).toBe("user");
    expect(m[0].content).toContain("<learner_input");
    expect(m[1].content).toBe("Retrieval...");
  });

  it("keeps only lesson ids that exist", () => {
    expect(knownIds(["x", "python-basics", "python-basics"], known)).toEqual(["python-basics"]);
  });
});
