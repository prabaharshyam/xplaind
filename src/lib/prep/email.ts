// PREP-7: the daily reminder email for an interview prep plan. Pure: what it says, and whether one is
// due. No database, network or UI imports.
import type { PrepPlan } from "./plan";

export const PREP_REMIND_CONSENT =
  "Yes, email me each morning until my interview with that day's questions from my prep plan. I can stop at any time with one click.";

/** One email a day at most, none after unsubscribing, none once the interview date has passed. */
export const reminderDue = (r: { last_sent_on: string | null; unsubscribed_at: string | null }, plan: PrepPlan, today: string): boolean =>
  !r.unsubscribed_at && plan.status === "ok" && r.last_sent_on !== today;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export type PrepEmailInput = { plan: Extract<PrepPlan, { status: "ok" }>; role: string; siteUrl: string; unsubscribeUrl: string };

/** The morning email: days left, what today holds and one link to the plan. Plain words, no tracking pixels. */
export function prepEmail(i: PrepEmailInput): { subject: string; text: string; html: string } {
  const { plan } = i;
  const today = plan.days[0];
  const url = `${i.siteUrl}/interview/prep`;
  const left = plan.daysLeft === 0 ? "Your interview is today" : `${count(plan.daysLeft, "day", "days")} to your ${i.role} interview`;
  const todo = [
    plan.review.length ? `${plan.review.length} to revise` : "",
    plan.fresh.length ? count(plan.fresh.length, "new question", "new questions") : "",
    today.mock === "full" ? "a full mock interview" : today.mock === "short" ? "a short mock interview" : "",
  ].filter(Boolean);
  const body =
    today.kind === "interview"
      ? "No new questions today. Go through the checklist once, then trust your preparation. Good luck."
      : today.kind === "final" && todo.length === 0
        ? "Today is for revision only: your weakest questions, and the day-before checklist."
        : todo.length
          ? `Today: ${todo.join(", ")}.${today.kind === "final" ? " Then go through the day-before checklist." : ""}`
          : "You have covered today's questions already. A few of your weakest ones are worth another look.";
  const progress = `${plan.covered} of ${count(plan.total, "question", "questions")} covered so far.`;
  const subject = plan.daysLeft === 0 ? "Your interview is today: the checklist" : `${left}: ${todo.length ? todo.join(", ") : "revision"}`;
  const text = [left, "", body, progress, "", `Open my plan: ${url}`, "", "Xplaind", "", `Stop these emails: ${i.unsubscribeUrl}`].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#fafafa;font-family:Arial,Helvetica,sans-serif;color:#18181b">
<div style="max-width:560px;margin:0 auto;padding:24px">
<p style="font-size:13px;color:#52525b;margin:0 0 8px">${esc(left)}</p>
<p style="font-size:16px;line-height:24px;margin:0 0 8px">${esc(body)}</p>
<p style="font-size:16px;line-height:24px;margin:0 0 20px">${esc(progress)}</p>
<p style="margin:0 0 24px"><a href="${esc(url)}" style="display:inline-block;background:#134e4a;color:#ffffff;text-decoration:none;font-size:16px;padding:12px 24px;border-radius:999px">Open my plan</a></p>
<p style="font-size:13px;color:#52525b;margin:0">Xplaind · <a href="${esc(i.unsubscribeUrl)}" style="color:#52525b">Stop these emails</a></p>
</div></body></html>`;
  return { subject, text, html };
}
