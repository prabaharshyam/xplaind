// NG-1 (2026-11-14, owner decision): at most two short nudges at the top of the dashboard, from what
// this device knows. Pure: no database, UI or framework imports. Dates are YYYY-MM-DD in India.
import { daysBetween } from "@/lib/dates";

export type Nudge = { id: string; text: string; cta: string; href: string };

export type NudgeInput = {
  today: string;
  /** Days with any study on this device. */
  activeDays: ReadonlySet<string>;
  /** Days in a row with study, up to today or yesterday. */
  streak: number;
  hasTest: boolean;
  interviewOn: string | null;
  path: { id: string; name: string };
  nextLesson: { id: string; title: string } | null;
  openLessons: number;
  week: { done: number; total: number } | null;
};

export const MAX_NUDGES = 2;
/** Days before an interview from which mock interviews are suggested first. */
export const INTERVIEW_SOON_DAYS = 14;
/** Days away after which the learner is welcomed back. */
export const AWAY_DAYS = 7;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function nudges(i: NudgeInput): Nudge[] {
  const out: Nudge[] = [];
  const last = [...i.activeDays].sort().at(-1) ?? null;

  if (i.interviewOn) {
    const days = daysBetween(i.today, i.interviewOn);
    if (days >= 1 && days <= INTERVIEW_SOON_DAYS)
      out.push({ id: "interview", text: `Your interview is in ${plural(days, "day", "days")}. A mock interview a day is the best use of the time left.`, cta: "Do a mock interview", href: `/interview/simulator?path=${i.path.id}` });
  }
  if (!last && !i.hasTest) out.push({ id: "first", text: "New here? A 2-minute check finds where your roadmap should start.", cta: "Take the 2-minute check", href: "/start" });
  if (last) {
    const away = daysBetween(last, i.today);
    if (away >= AWAY_DAYS && i.nextLesson)
      out.push({ id: "back", text: `Welcome back. It has been ${away} days, so start small: ${i.nextLesson.title}.`, cta: "Pick up here", href: `/stop/${i.nextLesson.id}` });
    else if (i.streak >= 2 && !i.activeDays.has(i.today) && i.nextLesson)
      out.push({ id: "streak", text: `You have studied ${i.streak} days in a row. One lesson today keeps it going.`, cta: "Keep the streak", href: `/stop/${i.nextLesson.id}` });
  }
  if (i.week && i.week.total > 0) {
    const left = i.week.total - i.week.done;
    if (left >= 1 && left <= 2) out.push({ id: "week", text: `${plural(left, "lesson", "lessons")} left in this week's plan.`, cta: "Finish the week", href: "/plan" });
  }
  if (i.openLessons >= 1 && i.openLessons <= 3 && i.nextLesson)
    out.push({ id: "finish", text: `Only ${plural(i.openLessons, "lesson", "lessons")} left to finish the ${i.path.name} roadmap.`, cta: "Next lesson", href: `/stop/${i.nextLesson.id}` });

  return out.slice(0, MAX_NUDGES);
}
