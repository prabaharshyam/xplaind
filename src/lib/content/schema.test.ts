import { describe, expect, it } from "vitest";
import {
  Book,
  CheckQuestion,
  InterviewQuestion,
  PRICE_CAP_INR,
  PlacementQuestion,
  Resource,
  StopFrontmatter,
} from "./schema";
import { book, check, interview, placement, resource, stop } from "./testing";

const messages = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  (r.error?.issues ?? []).map((i) => i.message).join(" | ");

describe("a valid record passes", () => {
  it.each([
    ["resource", () => Resource.safeParse(resource())],
    ["stop", () => StopFrontmatter.safeParse((({ body, ...rest }) => (void body, rest))(stop()))],
    ["placement question", () => PlacementQuestion.safeParse(placement())],
    ["check question", () => CheckQuestion.safeParse(check())],
    ["interview question", () => InterviewQuestion.safeParse(interview())],
    ["book", () => Book.safeParse(book())],
  ])("%s", (_name, run) => {
    const result = run();
    expect(messages(result)).toBe("");
    expect(result.success).toBe(true);
  });
});

describe("Resource (ED-1, ED-4, ED-8, RM-6)", () => {
  it("rejects a misspelled field, because objects are strict", () => {
    const r = Resource.safeParse({ ...resource(), affilate: true });
    expect(r.success).toBe(false);
  });

  it("needs affiliate_url exactly when the resource is affiliate (RM-5)", () => {
    const url = "https://example.org/course?tag=xplaind-21";
    expect(messages(Resource.safeParse({ ...resource(), affiliate: true }))).toMatch(/needs affiliate_url/);
    expect(Resource.safeParse({ ...resource(), affiliate: true, affiliate_url: url }).success).toBe(true);
    expect(messages(Resource.safeParse({ ...resource(), affiliate_url: url }))).toMatch(/only allowed when affiliate/);
  });

  it("rejects a missing last_verified date (ED-4)", () => {
    const { last_verified, ...rest } = resource();
    void last_verified;
    expect(Resource.safeParse(rest).success).toBe(false);
  });

  it("rejects a missing verified_by or why_picked (ED-4)", () => {
    expect(Resource.safeParse({ ...resource(), verified_by: "" }).success).toBe(false);
    expect(Resource.safeParse({ ...resource(), why_picked: "" }).success).toBe(false);
  });

  it("rejects why_picked over 280 characters", () => {
    expect(Resource.safeParse(resource({ why_picked: "x".repeat(281) })).success).toBe(false);
    expect(Resource.safeParse(resource({ why_picked: "x".repeat(280) })).success).toBe(true);
  });

  it("rejects a date that does not exist", () => {
    expect(Resource.safeParse(resource({ last_verified: "2026-02-31" })).success).toBe(false);
  });

  it("rejects a non-https link", () => {
    expect(Resource.safeParse(resource({ url: "http://example.org" })).success).toBe(false);
  });

  it("needs a price for a paid resource (RM-6)", () => {
    const r = Resource.safeParse(resource({ cost: "paid" }));
    expect(messages(r)).toContain("needs price_inr");
  });

  it("never allows a price without its check date (RM-6)", () => {
    const r = Resource.safeParse(resource({ cost: "paid", price_inr: 400 }));
    expect(messages(r)).toContain("check date");
    expect(Resource.safeParse(resource({ cost: "paid", price_inr: 400, price_checked_on: "2026-10-20" })).success).toBe(true);
  });

  it("rejects a price on a free resource", () => {
    const r = Resource.safeParse(resource({ cost: "free", price_inr: 100, price_checked_on: "2026-10-20" }));
    expect(r.success).toBe(false);
  });

  it("rejects a paid resource above the cap unless exception_reason is filled in (ED-1)", () => {
    const base = resource({ cost: "paid", price_inr: PRICE_CAP_INR + 1, price_checked_on: "2026-10-20" });
    expect(messages(Resource.safeParse(base))).toContain("ED-1");
    expect(Resource.safeParse({ ...base, exception_reason: "Only course with graded labs" }).success).toBe(true);
    expect(Resource.safeParse({ ...base, price_inr: PRICE_CAP_INR }).success).toBe(true);
  });

  it("requires hosted_by on a PDF link (ED-8)", () => {
    const pdf = resource({ url: "https://example.org/notes.pdf" });
    expect(messages(Resource.safeParse(pdf))).toContain("ED-8");
    expect(Resource.safeParse({ ...pdf, hosted_by: "Author's own site" }).success).toBe(true);
  });
});

describe("Stop frontmatter (RM-2)", () => {
  const { body, ...base } = stop();
  void body;

  it("keeps hours between 1 and 6", () => {
    expect(StopFrontmatter.safeParse({ ...base, hours: 0.5 }).success).toBe(false);
    expect(StopFrontmatter.safeParse({ ...base, hours: 7 }).success).toBe(false);
  });

  it("allows at most two alternates", () => {
    expect(StopFrontmatter.safeParse({ ...base, alternates: ["a", "b", "c"] }).success).toBe(false);
  });

  it("limits why_it_matters to 60 words", () => {
    const sixtyOne = Array.from({ length: 61 }, () => "word").join(" ");
    expect(messages(StopFrontmatter.safeParse({ ...base, why_it_matters: sixtyOne }))).toContain("60 words");
  });

  it("needs a check: 3 to 5 MCQs, or a project brief", () => {
    expect(StopFrontmatter.safeParse({ ...base, check: { type: "mcq", question_ids: ["a", "b"] } }).success).toBe(false);
    expect(StopFrontmatter.safeParse({ ...base, check: { type: "project", brief: "" } }).success).toBe(false);
    expect(StopFrontmatter.safeParse({ ...base, check: undefined }).success).toBe(false);
    expect(StopFrontmatter.safeParse({ ...base, check: { type: "project", brief: "Build it." } }).success).toBe(true);
  });

  it("needs a primary resource", () => {
    expect(StopFrontmatter.safeParse({ ...base, primary_resource: undefined }).success).toBe(false);
  });
});

describe("Questions (PL-1, IQ-1, IQ-5)", () => {
  it("needs exactly four options", () => {
    const three = placement().options.slice(0, 3);
    expect(PlacementQuestion.safeParse({ ...placement(), options: three }).success).toBe(false);
  });

  it("needs the correct answer to be one of the options", () => {
    expect(messages(PlacementQuestion.safeParse({ ...placement(), correct: "z" }))).toContain("not one of");
  });

  it("needs unique option ids", () => {
    const dup = placement().options.map((o) => ({ ...o, id: "a" }));
    expect(messages(PlacementQuestion.safeParse({ ...placement(), options: dup }))).toContain("unique");
  });

  it("needs an explanation and the review fields", () => {
    expect(CheckQuestion.safeParse({ ...check(), explanation: "" }).success).toBe(false);
    expect(PlacementQuestion.safeParse({ ...placement(), reviewed_by: undefined }).success).toBe(false);
    expect(PlacementQuestion.safeParse({ ...placement(), reviewed_on: undefined }).success).toBe(false);
    expect(PlacementQuestion.safeParse({ ...placement(), drafted_with_ai: undefined }).success).toBe(false);
  });

  it("only allows the interview topics from IQ-2", () => {
    expect(InterviewQuestion.safeParse({ ...interview(), topic: "cooking" }).success).toBe(false);
    expect(InterviewQuestion.safeParse({ ...interview(), topic: "agents" }).success).toBe(true);
  });

  it("limits an interview short answer to 60 words and needs 2 to 3 follow-ups", () => {
    const long = Array.from({ length: 61 }, () => "word").join(" ");
    expect(messages(InterviewQuestion.safeParse(interview({ short_answer: long })))).toContain("60 words");
    expect(InterviewQuestion.safeParse(interview({ follow_ups: ["one"] })).success).toBe(false);
    expect(InterviewQuestion.safeParse(interview({ follow_ups: ["1", "2", "3", "4"] })).success).toBe(false);
  });
});

describe("Book (BK, ED-8)", () => {
  it("only allows affiliate links, which are always labelled", () => {
    expect(Book.safeParse({ ...book(), affiliate: false }).success).toBe(false);
  });
  it("requires hosted_by for a hosted PDF", () => {
    const b = { ...book(), hosted_pdf_url: "https://example.org/book.pdf" };
    expect(messages(Book.safeParse(b))).toContain("ED-8");
    expect(Book.safeParse({ ...b, hosted_by: "The author" }).success).toBe(true);
  });
});
