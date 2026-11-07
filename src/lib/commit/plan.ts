// CM-90: "Commit to 90 days". Pure: which week a learner is in, whether an email is due, and
// what it says. No database, network or UI imports, so it is easy to test.
import { daysBetween } from "@/lib/dates";

export const COMMIT_WEEKS = 13;
export const COMMIT_CONSENT =
  "Yes, email me once a week for 13 weeks with my progress and the next lessons on my path. I can stop at any time with one click.";

export type Commitment = { started_on: string; last_sent_week: number; unsubscribed_at: string | null };

/** The commitment week (1-based) that `today` falls in; 0 before it starts. Dates are YYYY-MM-DD in India. */
export function weekOf(startedOn: string, today: string): number {
  const days = daysBetween(startedOn, today);
  return days < 0 ? 0 : Math.floor(days / 7) + 1;
}

/** The week whose email is due now, or null: one a week, at most 13, never after unsubscribing. */
export function dueWeek(c: Commitment, today: string): number | null {
  if (c.unsubscribed_at) return null;
  const week = Math.min(weekOf(c.started_on, today), COMMIT_WEEKS);
  if (week < 1 || week <= c.last_sent_week) return null;
  return week;
}

export type WeeklyEmailInput = {
  week: number;
  pathName: string;
  done: number;
  total: number;
  doneThisWeek: number;
  next: { id: string; title: string }[];
  siteUrl: string;
  unsubscribeUrl: string;
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The weekly email: progress, the next lessons and a one-click way to stop. Plain words, no tracking pixels. */
export function weeklyEmail(i: WeeklyEmailInput): { subject: string; text: string; html: string } {
  const last = i.week === COMMIT_WEEKS;
  const subject = last ? `Week 13 of 13: you made it, here is what is next` : `Week ${i.week} of 13 on ${i.pathName}: your next lessons`;
  const lead =
    i.doneThisWeek > 0
      ? `You finished ${i.doneThisWeek} ${i.doneThisWeek === 1 ? "lesson" : "lessons"} this week. ${i.done} of ${i.total} done on ${i.pathName}.`
      : i.done > 0
        ? `A quieter week, and that is fine. ${i.done} of ${i.total} done on ${i.pathName}. One lesson this week keeps you moving.`
        : `Your 90 days on ${i.pathName} start now. One lesson this week is a great start.`;
  const close = last ? "That is 13 weeks. Thank you for sticking with it. Keep going at your own pace; the roadmap stays here." : "See you next week.";
  const links = i.next.map((l) => ({ ...l, url: `${i.siteUrl}/stop/${l.id}` }));
  const text = [
    `Week ${i.week} of 13`,
    "",
    lead,
    "",
    links.length ? "Next up:" : "You have done every lesson on this path.",
    ...links.map((l) => `- ${l.title}: ${l.url}`),
    "",
    close,
    "",
    "Xplaind",
    "",
    `Stop these emails: ${i.unsubscribeUrl}`,
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#fafafa;font-family:Arial,Helvetica,sans-serif;color:#18181b">
<div style="max-width:560px;margin:0 auto;padding:24px">
<p style="font-size:13px;color:#52525b;margin:0 0 8px">Week ${i.week} of 13</p>
<p style="font-size:16px;line-height:24px;margin:0 0 16px">${esc(lead)}</p>
${links.length ? `<p style="font-size:16px;font-weight:bold;margin:0 0 8px">Next up</p><ul style="padding-left:20px;margin:0 0 16px">${links.map((l) => `<li style="margin:0 0 6px;font-size:16px;line-height:24px"><a href="${esc(l.url)}" style="color:#6d28d9">${esc(l.title)}</a></li>`).join("")}</ul>` : `<p style="font-size:16px">You have done every lesson on this path.</p>`}
<p style="font-size:16px;line-height:24px;margin:0 0 24px">${esc(close)}</p>
<p style="font-size:13px;color:#52525b;margin:0">Xplaind · <a href="${esc(i.unsubscribeUrl)}" style="color:#52525b">Stop these emails</a></p>
</div></body></html>`;
  return { subject, text, html };
}
