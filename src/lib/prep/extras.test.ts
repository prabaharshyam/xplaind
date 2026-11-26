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
    expect(storyFor("Tell me about an agent you built. What broke, and what did you learn?")).toBe("wrong");
    expect(storyFor("Tell me about a time you had a conflict with a teammate.")).toBe("disagree");
    expect(storyFor("Tell me about a time you led something without being the manager.")).toBe("lead");
    expect(storyFor("Tell me about a time you had to learn something new quickly.")).toBe("learn");
    expect(storyFor("Tell me about a time you delivered under a very tight deadline.")).toBe("learn");
    expect(storyFor("Tell me about an AI project you built.")).toBe("project");
  });

  it("offers no story for a question that is not answered with one", () => {
    for (const q of ["What are your salary expectations?", "What is your notice period, and how soon can you join?", "Do you have any questions for us?", "Why do you want to work at this company?", "How would you explain RAG to a non-technical manager?"]) {
      expect(storyFor(q), q).toBeNull();
    }
  });

  it("in the real bank, uses all five kinds and leaves the plain HR questions without one", () => {
    const behavioural = getInterviewViews().filter((q) => q.topic === "behavioral");
    const kinds = new Set(behavioural.map((q) => storyFor(q.question)).filter(Boolean));
    expect([...kinds].sort()).toEqual(STORY_KINDS.map((k) => k.id).sort());
    const withStory = behavioural.filter((q) => storyFor(q.question)).length;
    expect(withStory).toBeGreaterThan(behavioural.length * 0.4);
    expect(withStory).toBeLessThan(behavioural.length * 0.75);
  });

  it("checks what the device stored, and knows an empty story from a written one", () => {
    expect(Stories.safeParse({ wrong: { situation: "s", task: "", action: "", result: "" } }).success).toBe(true);
    expect(Stories.safeParse({ other: { situation: "s", task: "", action: "", result: "" } }).success).toBe(false);
    expect(storyWritten({ situation: " ", task: "", action: "", result: "" })).toBe(false);
    expect(storyWritten({ situation: "", task: "", action: "I rebuilt it", result: "" })).toBe(true);
    expect(storyWritten(undefined)).toBe(false);
  });
});
