// PREP-7: the daily interview prep email, called by Vercel Cron at 7:30 am India time. Protected by
// CRON_SECRET. For each learner who opted in and has a plan whose interview has not passed, it works
// out today from the plan and their ratings, sends the email through Resend, and records the day so
// nothing is sent twice. A job post lives only on the learner's device, so the email goes by the role's
// order; the counts are the same.
import { json, problem } from "@/lib/account/http";
import { getPath } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import { todayInIST } from "@/lib/dates";
import { sendEmail } from "@/lib/email";
import { isRating, type RatingRecord } from "@/lib/practice/queue";
import { prepEmail, reminderDue } from "@/lib/prep/email";
import { PrepSetupInput, prepPlan, prepSet } from "@/lib/prep/plan";
import { siteUrl } from "@/lib/site";
import { adminClient } from "@/lib/supabase/server";

export const maxDuration = 300;

type Reminder = { user_id: string; email: string; last_sent_on: string | null; unsubscribed_at: string | null; unsubscribe_token: string };

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return problem(401, "Not allowed.");
  if (!process.env.RESEND_API_KEY) return problem(503, "RESEND_API_KEY is not set.");
  const admin = adminClient();
  if (!admin) return problem(503, "Accounts are not configured.");

  const today = todayInIST();
  const { data, error } = await admin.from("prep_reminders").select("user_id, email, last_sent_on, unsubscribed_at, unsubscribe_token").is("unsubscribed_at", null);
  if (error) return problem(500, "Could not read reminders.");

  const bank = getInterviewViews();
  let sent = 0;
  let failed = 0;
  for (const r of (data ?? []) as Reminder[]) {
    const { data: row } = await admin.from("interview_preps").select("path_id, experience, interview_on, minutes, started_on").eq("user_id", r.user_id).maybeSingle();
    const setup = row && PrepSetupInput.safeParse({ pathId: row.path_id, experience: row.experience, interviewOn: row.interview_on, minutes: row.minutes, startedOn: row.started_on });
    const path = setup && setup.success ? getPath(setup.data.pathId) : undefined;
    if (!setup || !setup.success || !path) continue;
    const { data: rated } = await admin.from("practice_ratings").select("question_id, rating, updated_at").eq("user_id", r.user_id);
    const ratings: Record<string, RatingRecord> = {};
    for (const x of (rated ?? []) as { question_id: string; rating: number; updated_at: string }[]) {
      if (isRating(x.rating)) ratings[x.question_id] = { rating: x.rating, updatedOn: todayInIST(new Date(x.updated_at)) };
    }
    const plan = prepPlan(setup.data, prepSet(bank, path.top_interview ?? [], path.id, setup.data.experience).ids, ratings, today);
    if (plan.status !== "ok" || !reminderDue(r, plan, today)) continue;
    const unsubscribeUrl = `${siteUrl()}/api/prep/remind/unsubscribe?token=${r.unsubscribe_token}`;
    const email = prepEmail({ plan, role: path.name, siteUrl: siteUrl(), unsubscribeUrl });
    if (await sendEmail(r.email, email.subject, email.text, email.html, unsubscribeUrl)) {
      await admin.from("prep_reminders").update({ last_sent_on: today }).eq("user_id", r.user_id);
      sent++;
    } else failed++;
  }
  return json({ sent, failed });
}
