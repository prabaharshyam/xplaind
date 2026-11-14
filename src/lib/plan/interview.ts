// PP-1 (2026-11-14, owner decision): a placement plan worked back from an interview date. Pure: no
// database, UI or framework imports. Dates are YYYY-MM-DD in India (Asia/Kolkata).
import { daysBetween } from "@/lib/dates";
import type { LessonState, PlanLesson } from "./weekly";

/** Hours kept for mock interviews and interview questions when the whole plan is one week or less. */
export const SHORT_PRACTICE_HOURS = 2;
/** How far ahead an interview date can be. */
export const MAX_DAYS_AHEAD = 365;

export type InterviewWeek = { start: string; end: string; lessonIds: string[]; hours: number; practice: boolean };
export type InterviewPlan =
  | { status: "past" }
  | { status: "too_far" }
  | {
      status: "ok";
      daysLeft: number;
      weeks: InterviewWeek[];
      /** Lessons still open on the roadmap that do not fit before the date. */
      leftOut: number;
      /** Hours a week that would fit every open lesson and the practice. */
      neededPerWeek: number;
    };

const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

/**
 * Weeks from today to the day before the interview. Lessons still open go in roadmap order (ones
 * already started first), each week filled up to the learner's hours. With two weeks or more, the
 * last week is kept for mock interviews and interview questions; with one week, two hours of it are.
 */
export function interviewPlan(lessons: PlanLesson[], state: (id: string) => LessonState, today: string, interviewOn: string, hoursPerWeek: number): InterviewPlan {
  const daysLeft = daysBetween(today, interviewOn);
  if (daysLeft < 1) return { status: "past" };
  if (daysLeft > MAX_DAYS_AHEAD) return { status: "too_far" };

  const open = lessons.filter((l) => state(l.id) !== "done");
  const ordered = [...open.filter((l) => state(l.id) === "in_progress"), ...open.filter((l) => state(l.id) !== "in_progress")];
  const count = Math.ceil(daysLeft / 7);
  const weeks: InterviewWeek[] = Array.from({ length: count }, (_, i) => ({
    start: addDays(today, i * 7),
    end: addDays(today, Math.min(i * 7 + 6, daysLeft - 1)),
    lessonIds: [],
    hours: 0,
    practice: false,
  }));
  const practiceWeek = count >= 2 ? weeks[count - 1] : null;
  if (practiceWeek) practiceWeek.practice = true;
  const study = practiceWeek ? weeks.slice(0, -1) : weeks;
  // A part week has a share of the hours, never less than one.
  const budget = (w: InterviewWeek) => {
    const days = daysBetween(w.start, w.end) + 1;
    const full = (hoursPerWeek * days) / 7;
    return Math.max(1, practiceWeek ? full : full - SHORT_PRACTICE_HOURS);
  };

  let i = 0;
  for (const w of study) {
    const cap = budget(w);
    // Always at least one lesson a week while any are left, even when it is longer than the week.
    while (i < ordered.length && !(w.lessonIds.length && w.hours + ordered[i].hours > cap)) {
      w.lessonIds.push(ordered[i].id);
      w.hours += ordered[i].hours;
      i++;
    }
  }
  if (!practiceWeek && weeks.length) weeks[0].practice = true;

  const openHours = open.reduce((n, l) => n + l.hours, 0);
  const practiceHours = practiceWeek ? hoursPerWeek : SHORT_PRACTICE_HOURS;
  const studyWeeks = Math.max(1, study.length);
  return {
    status: "ok",
    daysLeft,
    weeks,
    leftOut: ordered.length - i,
    neededPerWeek: Math.ceil(practiceWeek ? openHours / studyWeeks : openHours + practiceHours),
  };
}
