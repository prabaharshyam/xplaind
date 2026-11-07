// CM-90: the weekly send, called by Vercel Cron on Monday mornings in India. Protected by
// CRON_SECRET. For each active commitment with an email due, it reads progress, writes the
// email and sends it through Resend, then records the week so nothing is sent twice.
import { json, problem } from "@/lib/account/http";
import { dueWeek, weeklyEmail } from "@/lib/commit/plan";
import { getPath, pathLessons } from "@/lib/content";
import { daysBetween, todayInIST } from "@/lib/dates";
import { siteUrl } from "@/lib/site";
import { adminClient } from "@/lib/supabase/server";

export const maxDuration = 300;

type Row = { user_id: string; path_id: string; email: string; started_on: string; last_sent_week: number; unsubscribed_at: string | null; unsubscribe_token: string };

async function send(to: string, subject: string, text: string, html: string, unsubscribeUrl: string): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.COMMIT_EMAIL_FROM || "Xplaind <hello@xplaind.in>",
      to,
      subject,
      text,
      html,
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }),
  });
  return res.ok;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return problem(401, "Not allowed.");
  if (!process.env.RESEND_API_KEY) return problem(503, "RESEND_API_KEY is not set.");
  const admin = adminClient();
  if (!admin) return problem(503, "Accounts are not configured.");

  const today = todayInIST();
  const { data, error } = await admin
    .from("commitments")
    .select("user_id, path_id, email, started_on, last_sent_week, unsubscribed_at, unsubscribe_token")
    .is("unsubscribed_at", null)
    .lt("last_sent_week", 13);
  if (error) return problem(500, "Could not read commitments.");

  let sent = 0;
  let failed = 0;
  for (const c of (data ?? []) as Row[]) {
    const week = dueWeek(c, today);
    const path = getPath(c.path_id);
    if (!week || !path) continue;
    const lessons = pathLessons(path.id);
    const { data: progress } = await admin.from("stop_progress").select("stop_id, status, updated_at").eq("user_id", c.user_id).eq("status", "done");
    const doneIds = new Set((progress ?? []).map((p: { stop_id: string }) => p.stop_id));
    const doneThisWeek = (progress ?? []).filter((p: { updated_at: string }) => daysBetween(todayInIST(new Date(p.updated_at)), today) < 7).length;
    const next = lessons.filter((l) => !doneIds.has(l.id)).slice(0, 3).map((l) => ({ id: l.id, title: l.title }));
    const unsubscribeUrl = `${siteUrl()}/api/commit/unsubscribe?token=${c.unsubscribe_token}`;
    const email = weeklyEmail({
      week,
      pathName: path.name,
      done: lessons.filter((l) => doneIds.has(l.id)).length,
      total: lessons.length,
      doneThisWeek,
      next,
      siteUrl: siteUrl(),
      unsubscribeUrl,
    });
    if (await send(c.email, email.subject, email.text, email.html, unsubscribeUrl)) {
      await admin.from("commitments").update({ last_sent_week: week, last_sent_at: new Date().toISOString() }).eq("user_id", c.user_id);
      sent++;
    } else failed++;
  }
  return json({ sent, failed });
}
