import { describe, expect, it } from "vitest";
import { getInterviewViews } from "@/lib/content/interview";
import { prepIcs, STORY_KINDS, Stories, storyFor, storyWritten } from "./extras";
import type { PrepSetup } from "./plan";

const setup: PrepSetup = { interviewOn: "2026-12-06", pathId: "ai-engineer", experience: "mid", minutes: 60, startedOn: "2026-11-26" };

describe("PREP-8 the calendar file", () => {
  it("has a practice block every evening until the day before, and the interview day", () => {
    const ics = prepIcs(setup, "AI Engineer", "2026-11-28", "https://xplaind.in/interview/prep", new Date("2026-11-28T03:00:00Z"));
    expect(ics).toContain("DTSTART;TZID=Asia/Kolkata:20261128T190000");
    expect(ics).toContain("DURATION:PT60M");
    expect(ics).toContain("RRULE:FREQ=DAILY;COUNT=8"); // 28 Nov to 5 Dec
    expect(ics).toContain("DTSTART;VALUE=DATE:20261206");
    expect(ics).toContain("DTEND;VALUE=DATE:20261207");
    expect(ics).toContain("SUMMARY:AI Engineer interview");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.split("\r\n").every((l) => !l.includes("\n"))).toBe(true);
  });

  it("on the interview day has only the interview, and escapes a role name with a comma", () => {
    const ics = prepIcs(setup, "AI, ML Engineer", "2026-12-06", "https://xplaind.in/interview/prep");
    expect(ics).not.toContain("RRULE");
    expect(ics).toContain("SUMMARY:AI\\, ML Engineer interview");
  });
});

describe("PREP-8 a story for each behavioural question", () => {
  it("matches a question to the story that answers it", () => {
    expect(storyFor("Tell me about your biggest failure.")).toBe("wrong");
    expect(storyFor("Tell me about a time you had a conflict with a teammate.")).toBe("disagree");
    expect(storyFor("Tell me about a time you led something without being the manager.")).toBe("lead");
    expect(storyFor("Tell me about a time you had to learn something new quickly.")).toBe("learn");
    expect(storyFor("Tell me about an AI project you built.")).toBe("project");
  });

  it("gives every behavioural question in the bank a story, and uses all five kinds", () => {
    const kinds = new Set(getInterviewViews().filter((q) => q.topic === "behavioral").map((q) => storyFor(q.question)));
    expect([...kinds].sort()).toEqual(STORY_KINDS.map((k) => k.id).sort());
  });

  it("checks what the device stored, and knows an empty story from a written one", () => {
    expect(Stories.safeParse({ wrong: { situation: "s", task: "", action: "", result: "" } }).success).toBe(true);
    expect(Stories.safeParse({ other: { situation: "s", task: "", action: "", result: "" } }).success).toBe(false);
    expect(storyWritten({ situation: " ", task: "", action: "", result: "" })).toBe(false);
    expect(storyWritten({ situation: "", task: "", action: "I rebuilt it", result: "" })).toBe(true);
    expect(storyWritten(undefined)).toBe(false);
  });
});
