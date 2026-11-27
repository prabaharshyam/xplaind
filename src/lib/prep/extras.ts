// PREP-8 (2026-11-26): the smaller helpers of the interview prep plan: a calendar file, the learner's
// own stories for behavioural questions, and what each interview round usually tests.
// Pure: no network, no database, no React.
import { z } from "zod";
import { daysBetween } from "@/lib/dates";
import type { PrepSetup } from "./plan";

const stamp = (date: string, time: string) => `${date.replace(/-/g, "")}T${time.replace(/:/g, "")}00`;
const fold = (s: string) => s.replace(/\\/g, "\\\\").replace(/[,;]/g, (c) => `\\${c}`).replace(/\r?\n/g, "\\n");

/** The hour of the evening practice block in the calendar file, India time. The learner can move it in their calendar. */
export const PRACTICE_TIME = "19:00";

/**
 * An .ics calendar file for the plan: a practice block every evening from today to the day before the
 * interview, as long as the learner's minutes, and the interview day itself as an all-day event.
 */
export function prepIcs(setup: PrepSetup, role: string, today: string, planUrl: string, now = new Date()): string {
  const days = daysBetween(today, setup.interviewOn);
  const dtstamp = `DTSTAMP:${now.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;
  const next = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10).replace(/-/g, "");
  };
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Xplaind//Interview prep plan//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Kolkata",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0530",
    "TZOFFSETTO:+0530",
    "TZNAME:IST",
    "END:STANDARD",
    "END:VTIMEZONE",
    ...(days >= 1
      ? [
          "BEGIN:VEVENT",
          "UID:interview-prep-daily@xplaind.in",
          dtstamp,
          `DTSTART;TZID=Asia/Kolkata:${stamp(today, PRACTICE_TIME)}`,
          `DURATION:PT${setup.minutes}M`,
          `RRULE:FREQ=DAILY;COUNT=${days}`,
          `SUMMARY:${fold(`Interview prep: today's questions (${role})`)}`,
          `DESCRIPTION:${fold(`Open today's questions: ${planUrl}`)}`,
          `URL:${planUrl}`,
          "BEGIN:VALARM",
          "TRIGGER:-PT0M",
          "ACTION:DISPLAY",
          "DESCRIPTION:Interview prep",
          "END:VALARM",
          "END:VEVENT",
        ]
      : []),
    "BEGIN:VEVENT",
    "UID:interview-prep-day@xplaind.in",
    dtstamp,
    `DTSTART;VALUE=DATE:${setup.interviewOn.replace(/-/g, "")}`,
    `DTEND;VALUE=DATE:${next(setup.interviewOn)}`,
    `SUMMARY:${fold(`${role} interview`)}`,
    `DESCRIPTION:${fold(`Your checklist: ${planUrl}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.join("\r\n")}\r\n`;
}

/**
 * The stories every candidate needs, and the behavioural questions each one answers. A question is
 * matched by its wording, first match wins. Many behavioural questions need no story at all (pay,
 * notice period, "why this company"): those match nothing.
 */
export const STORY_KINDS = [
  { id: "wrong", label: "Something that went wrong, and what you changed", match: /fail|mistake|went wrong|did not work|what broke|missed a|do differently|incident|were wrong|slowed/i },
  { id: "disagree", label: "A disagreement or a difficult person, and how you settled it", match: /conflict|disagree|difficult|hard to work with|said no|criticism|unhappy|ethical/i },
  { id: "lead", label: "A time you led, helped or went beyond your role", match: /\bled\b|helped someone|went beyond|change someone|improved|people who are not technical/i },
  { id: "learn", label: "A time you learned fast or handled something unclear", match: /learn|vague|without all the information|too many things|pressure|tight deadline|a risk you took|keep up/i },
  { id: "project", label: "A project you built and are proud of", match: /project you built|proud|tell me about (an? )?(ai |rag |agent )?project|used ai|demo|story/i },
] as const;
export type StoryKind = (typeof STORY_KINDS)[number]["id"];

/** The story that answers a behavioural question, or null when the question is not answered with one. */
export const storyFor = (question: string): StoryKind | null => STORY_KINDS.find((k) => k.match.test(question))?.id ?? null;

const Part = z.string().max(1200);
/** One story in four parts: Situation, Task, Action, Result. Kept on the device only (owner decision). */
export const Story = z.strictObject({ situation: Part, task: Part, action: Part, result: Part });
export type Story = z.infer<typeof Story>;
export const Stories = z.partialRecord(z.enum(STORY_KINDS.map((k) => k.id) as [StoryKind, ...StoryKind[]]), Story);
export type Stories = z.infer<typeof Stories>;
export const STORY_PARTS = [
  { id: "situation", label: "Situation", hint: "Where and when, in one or two lines." },
  { id: "task", label: "Task", hint: "What you had to do." },
  { id: "action", label: "Action", hint: "What you did, step by step. Say \"I\", not \"we\"." },
  { id: "result", label: "Result", hint: "What changed, with a number if you have one, and what you learned." },
] as const;
export const storyWritten = (s: Story | undefined): s is Story => !!s && [s.situation, s.task, s.action, s.result].some((p) => p.trim().length > 0);

/** What each round of an interview usually tests. General guidance, not a claim about any company. */
// UX-22 (2026-11-27, owner: "don't have sections with so much text"): one short line each.
export const ROUNDS = [
  { name: "Screening call", tests: "Fit, motivation, notice period and pay", prepare: "A 2-minute intro and honest pay answers" },
  { name: "Technical round", tests: "The ideas behind your work, reasoned out loud", prepare: "Your plan's questions, aloud, with trade-offs" },
  { name: "Coding or practical round", tests: "Working code, explained as you go", prepare: "Python, SQL, small ML tasks; talk while typing" },
  { name: "System design round", tests: "A whole system: parts, data, cost, failures", prepare: "One design aloud: questions, parts, trade-offs" },
  { name: "Behavioural or manager round", tests: "Conflict, failure, ownership and learning", prepare: "Your five stories, two minutes each" },
  { name: "HR round", tests: "Fit, pay, joining date, your questions", prepare: "Your pay range, your reasons, three questions" },
] as const;
