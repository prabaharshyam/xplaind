import { describe, expect, it } from "vitest";
import { LAUNCH_MINIMUMS, coverage, validateBundle } from "./validate";
import { isHumanName } from "./review";
import { TODAY, book, check, goal, interview, placement, resource, stop, validBundle } from "./testing";
import type { Bundle } from "./types";

const run = (bundle: Bundle, launch = false) => validateBundle(bundle, { today: TODAY, launch });
const errorsOf = (bundle: Bundle, launch = false) => run(bundle, launch).filter((i) => i.severity === "error");
const entry = <T>(file: string, data: T) => ({ file, data });

describe("a valid bundle", () => {
  it("has no errors in development mode", () => {
    expect(errorsOf(validBundle())).toEqual([]);
  });
});

// Each case breaks exactly one thing and must be caught (ED-8: "a deliberately
// broken fixture fails the command").
describe("broken bundles fail", () => {
  const cases: [string, (b: Bundle) => void, RegExp][] = [
    ["a stop points to a resource that does not exist", (b) => (b.stops[0].data.primary_resource = "nope"), /resource "nope" does not exist/],
    ["a stop lists its primary resource as an alternate", (b) => (b.stops[0].data.alternates = ["res-one"]), /must all be different/],
    ["a stop's MCQ points to a question that does not exist", (b) => (b.stops[0].data.check = { type: "mcq", question_ids: ["chk-1", "chk-2", "missing"] }), /"missing" does not exist/],
    ["a stop uses another stop's check question", (b) => (b.checks[0].data.stop_id = "other"), /does not exist|belongs to stop/],
    ["two stops share an id", (b) => b.stops.push(entry("stops/B1/dup.mdx", stop())), /duplicate stop id/],
    ["a path lists a lesson that does not exist", (b) => b.goals[0].data.stages[0].lessons.push("ghost"), /lesson "ghost" does not exist/],
    ["a path lists a lesson twice", (b) => b.goals[0].data.stages[1].lessons.push("stop-one"), /listed twice/],
    ["a level-laid path lists a lesson at the wrong level (RM-1)", (b) => (b.goals[0].data.stages = b.goals[0].data.stages.map((st) => ({ ...st, lessons: st.id === "B2" ? ["stop-one"] : [] }))), /B1 lesson, listed at B2/],
    ["a level-laid path is missing a level", (b) => b.goals[0].data.stages.pop(), /needs stages B1/],
    ["a staged path has a stage with no title", (b) => b.goals.push(entry("goals/fde.yaml", goal({ id: "fde", layout: "stages", stages: [{ id: "one", lessons: ["stop-one"], planned: [] }] }))), /needs a title and a summary/],
    ["a stage has nothing in it", (b) => b.goals.push(entry("goals/fde.yaml", goal({ id: "fde", layout: "stages", stages: [{ id: "one", title: "One", summary: "S.", lessons: [], planned: [] }] }))), /no lessons and nothing planned/],
    ["two resources share a link", (b) => b.resources.push(entry("resources/r2.yaml", resource({ id: "res-two" }))), /same url/],
    ["two resources share an id", (b) => b.resources.push(entry("resources/r3.yaml", resource({ url: "https://example.org/other" }))), /duplicate resource id/],
    ["an interview question points to a missing stop", (b) => (b.interview[0].data.stop_id = "ghost"), /stop "ghost" does not exist/],
    ["a topic sits on two levels (RM-1)", (b) => b.levels[1].data.topics.push({ id: "tag-one", title: "Again", summary: "Twice.", optional: false }), /listed at B1 and B2/],
    ["a stop's gap tag is not a topic (RM-1)", (b) => (b.stops[0].data.gap_tags = ["not-a-topic"]), /gap tag "not-a-topic" is not a topic/],
    ["a stop's gap tag is a topic from a higher level (RM-1)", (b) => (b.stops[0].data.gap_tags = ["b2-a"]), /is a B2 topic, above this B1 stop/],
    ["a placement tag is not a topic at the question's level (RM-1)", (b) => (b.placement[0].data.topic_tags = ["b3-a"]), /is a B3 topic, not B1/],
    ["a verified date is in the future", (b) => (b.resources[0].data.last_verified = "2026-12-01"), /in the future/],
    ["a review date is in the future", (b) => (b.stops[0].data.reviewed_on = "2027-01-01"), /in the future/],
    ["the levels are out of order", (b) => b.levels.reverse(), /exactly B1, B2/],
    ["a level is missing", (b) => b.levels.pop(), /exactly B1, B2/],
    ["there is no goal", (b) => (b.goals = []), /at least one goal/],
  ];

  it.each(cases)("%s", (_name, mutate, pattern) => {
    const bundle = validBundle();
    mutate(bundle);
    const messages = errorsOf(bundle).map((i) => i.message);
    expect(messages.some((m) => pattern.test(m))).toBe(true);
  });
});

describe("human sign-off (IQ-6, ED-9)", () => {
  const aiReviewed = () => {
    const b = validBundle();
    b.stops[0].data.reviewed_by = "Claude";
    b.checks[0].data.reviewed_by = "UNREVIEWED: drafted by Claude";
    b.placement[0].data.reviewed_by = "gpt-draft";
    b.interview[0].data.reviewed_by = "TBD";
    b.resources[0].data.verified_by = "UNVERIFIED";
    return b;
  };

  it("is a warning while building and an error at launch", () => {
    expect(errorsOf(aiReviewed(), false)).toEqual([]);
    const atLaunch = errorsOf(aiReviewed(), true).filter((i) => /not a person/.test(i.message));
    expect(atLaunch).toHaveLength(5);
  });

  it("recognises people and placeholders", () => {
    expect(isHumanName("Shyam Prabahar")).toBe(true);
    expect(isHumanName("Asha Rao")).toBe(true);
    expect(isHumanName("Claude")).toBe(false);
    expect(isHumanName("claude-code (needs human re-check)")).toBe(false);
    expect(isHumanName("UNVERIFIED: drafted by Claude")).toBe(false);
    expect(isHumanName("AI")).toBe(false);
    expect(isHumanName("   ")).toBe(false);
  });
});

describe("launch coverage (PL-1, RM-2, IQ-2)", () => {
  it("lists gaps as warnings in development and errors at launch", () => {
    const dev = run(validBundle(), false).filter((i) => i.file.startsWith("coverage/"));
    expect(dev.length).toBeGreaterThan(0);
    expect(dev.every((i) => i.severity === "warning")).toBe(true);
    const launch = run(validBundle(), true).filter((i) => i.file.startsWith("coverage/"));
    expect(launch.every((i) => i.severity === "error")).toBe(true);
  });

  it("passes a level that has enough questions and stops", () => {
    const b = validBundle();
    for (let n = 2; n <= LAUNCH_MINIMUMS.placementPerLevel; n++) {
      b.placement.push(entry(`questions/placement/p${n}.yaml`, placement({ id: `pq-${n}` })));
    }
    for (let n = 2; n <= LAUNCH_MINIMUMS.stopsPerLevel; n++) {
      b.stops.push(entry(`stops/B1/s${n}.mdx`, stop({ id: `stop-${n}`, check: { type: "project", brief: "Do it." } })));
    }
    const b1Gaps = run(b, true).filter((i) => i.file === "coverage/B1");
    expect(b1Gaps).toEqual([]);
  });

  it("lists a core topic with no stop, but not an optional one (RM-2)", () => {
    const messages = run(validBundle(), true).map((i) => i.message);
    expect(messages).toContain('core topic "b2-a" has no stop at B2 yet');
    expect(messages.some((m) => m.includes('"b2-b"'))).toBe(false);
  });

  it("flags an interview topic with fewer than 5 questions", () => {
    const gaps = run(validBundle(), true).filter((i) => i.file === "coverage/interview/rag");
    expect(gaps).toHaveLength(1);
  });

  it("counts per level for the report", () => {
    const rows = coverage(validBundle());
    expect(rows).toHaveLength(9);
    expect(rows[0]).toMatchObject({ level: "B1", stops: 1, stopHours: 2, placement: 1, checks: 3, resources: 1 });
    expect(rows[1]).toMatchObject({ level: "B2", stops: 0 });
  });
});

describe("gap tags map to a review stop (PL-4)", () => {
  it("reports a topic tag with no stop at that level or below", () => {
    const b = validBundle();
    b.placement.push(entry("questions/placement/p9.yaml", placement({ id: "pq-9", topic_tags: ["orphan-tag"] })));
    const issues = run(b).filter((i) => i.rule === "PL-4");
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain("orphan-tag");
  });

  it("accepts a tag covered by an easier stop, but not by a harder one", () => {
    const b = validBundle();
    b.placement.push(entry("questions/placement/p8.yaml", placement({ id: "pq-8", level: "B3", topic_tags: ["tag-one"] })));
    expect(run(b).filter((i) => i.rule === "PL-4")).toEqual([]);
    const b2 = validBundle();
    b2.stops[0].data.level = "I1";
    expect(run(b2).filter((i) => i.rule === "PL-4")).toHaveLength(1);
  });
});

describe("warnings", () => {
  it("flags a resource no stop uses", () => {
    const b = validBundle();
    b.resources.push(entry("resources/unused.yaml", resource({ id: "unused", url: "https://example.org/unused" })));
    expect(run(b).some((i) => i.severity === "warning" && /not used by any stop/.test(i.message))).toBe(true);
  });

  it("flags a stale verification date and a stale price (RM-6)", () => {
    const b = validBundle();
    b.resources[0].data = resource({ last_verified: "2026-01-01", cost: "paid", price_inr: 400, price_checked_on: "2026-08-01" });
    const messages = run(b).filter((i) => i.severity === "warning").map((i) => i.message);
    expect(messages.some((m) => /last_verified .* days old/.test(m))).toBe(true);
    expect(messages.some((m) => /price may have changed/.test(m))).toBe(true);
  });

  it("flags an unused check question", () => {
    const b = validBundle();
    b.checks.push(entry("questions/checks/extra.yaml", check({ id: "extra" })));
    expect(run(b).some((i) => /not used by its stop/.test(i.message))).toBe(true);
  });
});

describe("a book and an interview question in the bundle", () => {
  it("do not break a valid bundle", () => {
    const b = validBundle();
    b.books.push(entry("books/b2.yaml", book({ id: "book-2" })));
    b.interview.push(entry("questions/interview/iq-2.yaml", interview({ id: "iq-2" })));
    expect(errorsOf(b)).toEqual([]);
  });
});
