// PREP-7: opt in to, read, or stop the daily interview prep email. The session is checked here; the
// row is written with the service role (the learner can only read it under RLS).
import { z } from "zod";
import { json, problem, rateLimit, readJson, requireSession } from "@/lib/account/http";
import { getPath } from "@/lib/content";
import { PREP_REMIND_CONSENT } from "@/lib/prep/email";
import { PrepSetupInput } from "@/lib/prep/plan";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { data } = await session.client.from("prep_reminders").select("unsubscribed_at").maybeSingle();
  return json({ active: !!data && !data.unsubscribed_at });
}

// The plan comes with the consent and is saved to the account first, so the morning email always has a plan to read.
const Body = z.strictObject({ consent: z.literal(true), prep: PrepSetupInput });

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const limited = await rateLimit(session.admin, `prep-remind:${session.user.id}`, 600, 20);
  if (limited) return limited;
  const parsed = Body.safeParse(await readJson(request).catch(() => null));
  if (!parsed.success) return problem(400, "Tick the box to agree to the daily emails.");
  if (!getPath(parsed.data.prep.pathId)) return problem(400, "That plan could not be read. Save your plan again, then turn the emails on.");
  if (!session.user.email) return problem(400, "Your account has no email address.");
  const p = parsed.data.prep;
  const saved = await session.client
    .from("interview_preps")
    .upsert({ user_id: session.user.id, path_id: p.pathId, experience: p.experience, interview_on: p.interviewOn, minutes: p.minutes, started_on: p.startedOn, updated_at: new Date().toISOString() });
  if (saved.error) return problem(500, "Could not save your plan. Please try again.");
  const { error } = await session.admin
    .from("prep_reminders")
    .upsert({ user_id: session.user.id, email: session.user.email, consent_text: PREP_REMIND_CONSENT, consent_at: new Date().toISOString(), unsubscribed_at: null }, { onConflict: "user_id" });
  if (error) return problem(500, "Could not save. Please try again.");
  return json({ ok: true });
}

export async function DELETE() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { error } = await session.admin.from("prep_reminders").update({ unsubscribed_at: new Date().toISOString() }).eq("user_id", session.user.id);
  if (error) return problem(500, "Could not stop the emails. Please try again.");
  return json({ ok: true });
}
