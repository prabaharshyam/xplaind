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
export const ROUNDS = [
  { name: "Screening call", tests: "Whether your background fits the role: your resume, why you want the job, your notice period and your expected pay.", prepare: "Your two-minute introduction, and honest answers on pay and joining date." },
  { name: "Technical round", tests: "Whether you understand the ideas behind your work and can reason through a problem out loud.", prepare: "The role questions in this plan, answered aloud. Say the trade-offs, not only the definition." },
  { name: "Coding or practical round", tests: "Whether you can write working code or build something small, and explain it as you go.", prepare: "Python, SQL and small machine learning tasks. Talk while you type." },
  { name: "System design round", tests: "Whether you can design a whole system: the parts, the data, the cost, and what breaks.", prepare: "Practise one design out loud: ask questions first, then name the parts, then the trade-offs." },
  { name: "Behavioural or manager round", tests: "How you work with people: conflict, failure, ownership and learning.", prepare: "Your five stories, each told in about two minutes." },
  { name: "HR round", tests: "Fit, pay, joining date and your questions for them.", prepare: "Your pay range from research, your reasons for the move, and three questions to ask." },
] as const;
