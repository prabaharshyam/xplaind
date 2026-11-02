// WP-1 to WP-3: the weekly study plan. Pure: no database, UI or framework imports.
// Weeks run Monday to Sunday in India (Asia/Kolkata), as everywhere on the site.

export type PlanLesson = { id: string; title: string; hours: number };
export type LessonState = "in_progress" | "done" | undefined;

/** Hours a learner can pick, and the time a practice-card session takes out of the week. */
export const HOUR_CHOICES = [2, 4, 6, 8, 10, 15] as const;
export const PRACTICE_HOURS = 0.5;

const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

/** The Monday and Sunday of the week that contains `today` (YYYY-MM-DD, already in India time). */
export function weekOf(today: string): { start: string; end: string } {
  const d = utc(today);
  const back = (d.getUTCDay() + 6) % 7; // Monday is 0
  const start = new Date(d.getTime() - back * 86_400_000);
  return { start: iso(start), end: iso(new Date(start.getTime() + 6 * 86_400_000)) };
}

/**
 * This week's lessons: ones already started come first, then the next ones in roadmap order,
 * until the week's hours are used (after a short practice session). Always at least one lesson,
 * even when it is longer than the week, so the plan never comes up empty.
 */
export function planWeek(lessons: PlanLesson[], state: (id: string) => LessonState, hoursPerWeek: number): { items: PlanLesson[]; hours: number; left: number } {
  const open = lessons.filter((l) => state(l.id) !== "done");
  const ordered = [...open.filter((l) => state(l.id) === "in_progress"), ...open.filter((l) => state(l.id) !== "in_progress")];
  const budget = Math.max(0.5, hoursPerWeek - PRACTICE_HOURS);
  const items: PlanLesson[] = [];
  let hours = 0;
  for (const l of ordered) {
    if (items.length && hours + l.hours > budget) continue;
    items.push(l);
    hours += l.hours;
    if (hours >= budget) break;
  }
  return { items, hours, left: open.length - items.length };
}

/** A plan saved for one week, so it stays put while lessons are ticked off. */
export type SavedPlan = { week: string; pathId: string; hours: number; lessonIds: string[] };

/** Keep the saved plan for this week and these settings; otherwise make a new one. */
export function currentPlan(saved: SavedPlan | null, week: string, pathId: string, hours: number, make: () => string[]): SavedPlan {
  if (saved && saved.week === week && saved.pathId === pathId && saved.hours === hours && saved.lessonIds.length) return saved;
  return { week, pathId, hours, lessonIds: make() };
}

// ------------------------------------------------------------------ reminders (WP-3) --

const stamp = (date: string, time: string) => `${date.replace(/-/g, "")}T${time.replace(/:/g, "")}00`;

/** The next Monday on or after `today`, the day the weekly reminder starts. */
export function nextMonday(today: string): string {
  const d = utc(today);
  const ahead = (8 - d.getUTCDay()) % 7;
  return iso(new Date(d.getTime() + ahead * 86_400_000));
}

/** An .ics calendar file: a 30-minute event every Monday at 9 am India time, linking to the plan. */
export function reminderIcs(firstMonday: string, planUrl: string, now = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Xplaind//Weekly study plan//EN",
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
    "BEGIN:VEVENT",
    "UID:weekly-plan@xplaind.in",
    `DTSTAMP:${now.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;TZID=Asia/Kolkata:${stamp(firstMonday, "09:00")}`,
    "DURATION:PT30M",
    "RRULE:FREQ=WEEKLY;BYDAY=MO",
    "SUMMARY:Plan your AI study week on Xplaind",
    `DESCRIPTION:Open this week's plan: ${planUrl}`,
    `URL:${planUrl}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT0M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Plan your AI study week",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.join("\r\n")}\r\n`;
}

/** The same weekly reminder as a Google Calendar link. */
export function googleCalendarLink(firstMonday: string, planUrl: string): string {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: "Plan your AI study week on Xplaind",
    details: `Open this week's plan: ${planUrl}`,
    dates: `${stamp(firstMonday, "09:00")}/${stamp(firstMonday, "09:30")}`,
    ctz: "Asia/Kolkata",
    recur: "RRULE:FREQ=WEEKLY;BYDAY=MO",
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
