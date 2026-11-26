import { describe, expect, it } from "vitest";
import { getPaths } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import { EXPERIENCE_IDS } from "@/lib/interview/setup";
import type { Rating, Ratings } from "@/lib/practice/queue";
import { addDays, perDay, pickPrep, prepPlan, prepReadiness, prepSet, type PrepQuestion, type PrepSetup } from "./plan";

const q = (id: string, level: string, topic = "rag", paths = ["role"]): PrepQuestion => ({ id, level, topic, paths });
const ids = (n: number) => Array.from({ length: n }, (_, i) => `q${i + 1}`);
const setup = (over: Partial<PrepSetup> = {}): PrepSetup => ({ interviewOn: "2026-12-06", pathId: "role", experience: "mid", minutes: 60, startedOn: "2026-11-26", ...over });
const rated = (entries: [string, Rating, string][]): Ratings => Object.fromEntries(entries.map(([id, rating, updatedOn]) => [id, { rating, updatedOn }]));
const ok = (p: ReturnType<typeof prepPlan>) => {
  if (p.status !== "ok") throw new Error(p.status);
  return p;
};

describe("PREP-1 the question set", () => {
  it("takes only the role's questions, nearest the learner's level first, Top 25 first within a level", () => {
    const all = [q("far", "B1"), q("near", "B3"), q("fit", "I2"), q("fit-top", "P1"), q("other-role", "I2", "rag", ["x"])];
    const set = prepSet(all, ["fit-top"], "role", "mid"); // mid is I1 to P2
    expect(set.ids).toEqual(["fit-top", "fit", "near", "far"]);
    expect(set).toMatchObject({ core: 4, behavioural: 0, stretch: 1 });
  });

  it("puts one behavioural question after every four technical ones, nearest the level first, and the rest last", () => {
    const all = [...ids(9).map((id) => q(id, "I2")), q("b-far", "B1", "behavioral"), q("b-fit", "I2", "behavioral"), q("b-near", "B3", "behavioral")];
    expect(prepSet(all, [], "role", "mid").ids).toEqual(["q1", "q2", "q3", "q4", "b-fit", "q5", "q6", "q7", "q8", "b-near", "q9", "b-far"]);
    // One asked in almost every interview comes before the others, whatever its level.
    const often = [...all, { ...q("b-always", "B1", "behavioral"), often: true }];
    expect(prepSet(often, [], "role", "mid").ids.filter((id) => id.startsWith("b-"))).toEqual(["b-always", "b-fit", "b-near", "b-far"]);
    // Many more behavioural than technical: the role's questions are still all in the first part, and none is dropped.
    const few = [q("q1", "I2"), q("b1", "I1", "behavioral"), q("b2", "I1", "behavioral"), q("b3", "I1", "behavioral")];
    expect(prepSet(few, [], "role", "mid").ids).toEqual(["q1", "b1", "b2", "b3"]);
    const many = [...ids(40).map((id) => q(id, "I2")), ...ids(60).map((id) => q(`b${id}`, "I2", "behavioral"))];
    const first50 = prepSet(many, [], "role", "mid").ids.slice(0, 50);
    expect(first50.filter((id) => !id.startsWith("b"))).toHaveLength(40);
  });

  it("gives every role and experience level in the real bank a set, with no question twice", () => {
    const all = getInterviewViews();
    for (const path of getPaths()) {
      for (const experience of EXPERIENCE_IDS) {
        const set = prepSet(all, path.top_interview ?? [], path.id, experience);
        expect(set.ids.length, `${path.id} ${experience}`).toBeGreaterThanOrEqual(25);
        expect(new Set(set.ids).size).toBe(set.ids.length);
        expect(set.core + set.behavioural).toBe(set.ids.length);
      }
    }
  });
});

describe("PREP-1 the day-by-day plan", () => {
  it("ten days at 60 minutes: ten new questions a day, the day before for revision, none on the day", () => {
    const p = ok(prepPlan(setup(), ids(100), {}, "2026-11-26"));
    expect(perDay(60)).toBe(10);
    expect(p.daysLeft).toBe(10);
    expect(p.days).toHaveLength(11);
    expect(p.fresh).toEqual(ids(10));
    expect(p.days.map((d) => d.ids.length)).toEqual([10, 10, 10, 10, 10, 10, 10, 10, 10, 0, 0]);
    expect(p.days.at(-2)).toMatchObject({ date: "2026-12-05", kind: "final" });
    expect(p.days.at(-1)).toMatchObject({ date: "2026-12-06", kind: "interview", mock: null });
    expect(p.leftOut).toBe(10); // nine study days hold 90 of the 100
    expect(p).toMatchObject({ total: 100, covered: 0, review: [], doneToday: 0 });
  });

  it("puts a short mock on every third day and the full one two days before", () => {
    const p = ok(prepPlan(setup(), ids(100), {}, "2026-11-26"));
    expect(p.days.filter((d) => d.mock).map((d) => [d.date, d.mock])).toEqual([
      ["2026-11-28", "short"],
      ["2026-12-01", "short"],
      ["2026-12-04", "full"], // also a third day: the full mock wins
    ]);
  });

  it("says when everything fits, and stops handing out questions once they are covered", () => {
    const p = ok(prepPlan(setup({ interviewOn: "2027-01-25" }), ids(25), {}, "2026-11-26")); // 60 days
    expect(p.leftOut).toBe(0);
    expect(p.days.map((d) => d.ids.length).slice(0, 4)).toEqual([10, 10, 5, 0]);
  });

  it("an interview tomorrow still gets today's questions and the full mock; the day itself gets none", () => {
    const tomorrow = setup({ interviewOn: "2026-11-27" });
    const p = ok(prepPlan(tomorrow, ids(30), {}, "2026-11-26"));
    expect(p.days).toEqual([
      { date: "2026-11-26", kind: "final", ids: ids(10), mock: "full" },
      { date: "2026-11-27", kind: "interview", ids: [], mock: null },
    ]);
    expect(p.leftOut).toBe(20);
    const onTheDay = ok(prepPlan(tomorrow, ids(30), {}, "2026-11-27"));
    expect(onTheDay).toMatchObject({ daysLeft: 0, fresh: [], leftOut: 30 });
    expect(prepPlan(tomorrow, ids(30), {}, "2026-11-28").status).toBe("past");
  });

  it("the day before a longer plan is revision only: no new questions, even with some left", () => {
    const p = ok(prepPlan(setup(), ids(100), {}, "2026-12-05")); // started 26 Nov, interview 6 Dec
    expect(p.days[0]).toMatchObject({ kind: "final", ids: [] });
    expect(p).toMatchObject({ fresh: [], leftOut: 100 });
  });

  it("counts a question as covered only when it was rated since the plan started", () => {
    const ratings = rated([["q1", 2, "2026-11-01"], ["q2", 2, "2026-11-26"]]);
    const p = ok(prepPlan(setup(), ids(100), ratings, "2026-11-26"));
    expect(p.covered).toBe(1);
    expect(p.doneToday).toBe(1);
    expect(p.fresh).toEqual(["q1", ...ids(10).slice(2)]); // q1 again, q2 done, nine left of today's ten
  });

  it("brings back missed questions the next day and partly ones after two days, before anything new", () => {
    const ratings = rated([["q1", 0, "2026-11-26"], ["q2", 1, "2026-11-26"], ["q3", 1, "2026-11-25"], ["q4", 2, "2026-11-25"]]);
    const p = ok(prepPlan(setup({ startedOn: "2026-11-25" }), ids(100), ratings, "2026-11-27"));
    expect(p.review).toEqual(["q1", "q3"]); // missed first; q2 is back tomorrow; q4 was got
    expect(p.fresh).toHaveLength(8); // revision uses two of today's ten
    expect(p.fresh[0]).toBe("q5");
  });

  it("a missed day rolls forward: nothing is lost, and what no longer fits is counted", () => {
    const first = ok(prepPlan(setup(), ids(90), {}, "2026-11-26"));
    expect(first.leftOut).toBe(0);
    const afterSkippingDayOne = ok(prepPlan(setup(), ids(90), {}, "2026-11-27"));
    expect(afterSkippingDayOne.fresh).toEqual(ids(10));
    expect(afterSkippingDayOne.leftOut).toBe(10);
  });

  it("keeps every date inside the plan and in order", () => {
    const p = ok(prepPlan(setup(), ids(5), {}, "2026-11-30"));
    expect(p.days.map((d) => d.date)).toEqual(Array.from({ length: 7 }, (_, i) => addDays("2026-11-30", i)));
  });
});

describe("PREP-1 readiness", () => {
  const questions = [q("a", "I1", "rag"), q("b", "I1", "rag"), q("c", "I1", "evals"), q("d", "I1", "evals")];

  it("is the share of got it (partly counts half) over the whole plan, with the weakest topics named", () => {
    const ratings = rated([["a", 2, "2026-11-26"], ["b", 1, "2026-11-26"], ["c", 0, "2026-11-26"], ["d", 2, "2026-11-20"]]);
    const r = prepReadiness(questions, ratings, "2026-11-26", null);
    expect(r.score).toBe(38); // (1 + 0.5 + 0) of 4; d was rated before the plan
    expect(r.weak).toEqual([
      { topic: "evals", gotIt: 0, rated: 1 },
      { topic: "rag", gotIt: 1, rated: 2 },
    ]);
  });

  it("counts a mock interview score for 30% when there is one, and is 0 with nothing done", () => {
    expect(prepReadiness(questions, rated([["a", 2, "2026-11-26"], ["b", 2, "2026-11-26"]]), "2026-11-26", 80).score).toBe(59); // 50 * 0.7 + 80 * 0.3
    expect(prepReadiness(questions, {}, "2026-11-26", null)).toEqual({ score: 0, weak: [] });
  });
});

describe("PREP-3 one plan across devices", () => {
  it("keeps the plan started later, and the account's on a tie", () => {
    const older = setup({ startedOn: "2026-11-20" });
    const newer = setup({ startedOn: "2026-11-26", minutes: 30 });
    expect(pickPrep(newer, older)).toBe(newer);
    expect(pickPrep(older, newer)).toBe(newer);
    expect(pickPrep(setup({ minutes: 90 }), setup())).toMatchObject({ minutes: 60 });
    expect(pickPrep(null, older)).toBe(older);
    expect(pickPrep(older, null)).toBe(older);
    expect(pickPrep(null, null)).toBeNull();
  });
});
