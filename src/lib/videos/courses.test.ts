import { describe, expect, it } from "vitest";
import { ALL } from "./browse";
import { type CourseRow, EMPTY_COURSE_FILTER, courseLength, filterCourses, formatHours, platformOf } from "./courses";

const row = (o: Partial<CourseRow> & { id: string }): CourseRow => ({
  title: o.id,
  provider: "DeepLearning.AI",
  instructors: ["Someone"],
  topics: ["llm"],
  level: "I1",
  hours: 1,
  published: "2025-01-01",
  cost: "Free",
  embed: null,
  notice: null,
  lesson: null,
  ...o,
});

const rows = [
  row({ id: "ml", title: "Machine Learning Specialization", instructors: ["Andrew Ng"], topics: ["ml"], level: "I1", hours: 68, published: "2025-06-27" }),
  row({ id: "ctx", title: "Context Engineering", instructors: ["Jeff Huber", "Drew Breunig"], topics: ["agents", "llm"], level: "P1", hours: 2.5, published: "2026-10-20" }),
  row({ id: "prompt", title: "ChatGPT Prompt Engineering", instructors: ["Isa Fulford", "Andrew Ng"], topics: ["llm"], level: "I1", hours: 0.5, published: "2023-04-27", lesson: { id: "prompt-design", title: "Prompt design" } }),
  row({ id: "cs229", title: "Stanford CS229", provider: "Stanford Online", instructors: ["Andrew Ng"], topics: ["ml"], level: "I1", hours: 28, published: null }),
];

describe("filterCourses (VD-2)", () => {
  it("puts the newest first by default, and courses with no date last", () => {
    expect(filterCourses(rows, EMPTY_COURSE_FILTER).map((r) => r.id)).toEqual(["ctx", "ml", "prompt", "cs229"]);
  });

  it("keeps only Andrew Ng's courses, including ones he co-teaches", () => {
    expect(filterCourses(rows, { ...EMPTY_COURSE_FILTER, andrewNg: true }).map((r) => r.id)).toEqual(["ml", "prompt", "cs229"]);
  });

  it("filters by topic, level band and length", () => {
    expect(filterCourses(rows, { ...EMPTY_COURSE_FILTER, topic: "agents" }).map((r) => r.id)).toEqual(["ctx"]);
    expect(filterCourses(rows, { ...EMPTY_COURSE_FILTER, band: "P" }).map((r) => r.id)).toEqual(["ctx"]);
    expect(filterCourses(rows, { ...EMPTY_COURSE_FILTER, length: "long" }).map((r) => r.id)).toEqual(["ml", "cs229"]);
    expect(courseLength(1.9)).toBe("short");
    expect(courseLength(2)).toBe("medium");
    expect(courseLength(10.5)).toBe("long");
  });

  it("searches title, provider, instructors and lesson", () => {
    expect(filterCourses(rows, { ...EMPTY_COURSE_FILTER, query: "stanford" }).map((r) => r.id)).toEqual(["cs229"]);
    expect(filterCourses(rows, { ...EMPTY_COURSE_FILTER, query: "breunig" }).map((r) => r.id)).toEqual(["ctx"]);
    expect(filterCourses(rows, { ...EMPTY_COURSE_FILTER, query: "prompt design" }).map((r) => r.id)).toEqual(["prompt"]);
    expect(filterCourses(rows, { ...EMPTY_COURSE_FILTER, topic: ALL, query: "nothing like this" })).toEqual([]);
  });

  it("sorts by length and by level", () => {
    expect(filterCourses(rows, { ...EMPTY_COURSE_FILTER, sort: "short" }).map((r) => r.id)).toEqual(["prompt", "ctx", "cs229", "ml"]);
    expect(filterCourses(rows, { ...EMPTY_COURSE_FILTER, sort: "level" }).map((r) => r.id)[3]).toBe("ctx");
  });

  it("formats course length", () => {
    expect(formatHours(0.5)).toBe("30 min");
    expect(formatHours(1)).toBe("about 1 hour");
    expect(formatHours(2.4)).toBe("about 2.5 hours");
    expect(formatHours(68)).toBe("about 68 hours");
  });
});

describe("platform filter (VD-2)", () => {
  it("files provider names under one platform", () => {
    expect(platformOf("Anthropic Academy")).toBe("Anthropic");
    expect(platformOf("DeepLearningAI on YouTube")).toBe("DeepLearning.AI");
    expect(platformOf("Google Skills")).toBe("Google");
    expect(platformOf("Harvard CS50")).toBe("Harvard");
    expect(platformOf("fast.ai")).toBe("fast.ai");
  });

  it("keeps only the chosen platform", () => {
    expect(filterCourses(rows, { ...EMPTY_COURSE_FILTER, platform: "Stanford" }).map((r) => r.id)).toEqual(["cs229"]);
  });
});
