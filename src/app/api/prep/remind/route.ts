// PREP-7: opt in to, read, or stop the daily interview prep email. The session is checked here; the
// row is written with the service role (the learner can only read it under RLS).
import { z } from "zod";
import { json, problem, readJson, requireSession } from "@/lib/account/http";
import { PREP_REMIND_CONSENT } from "@/lib/prep/email";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { data } = await session.client.from("prep_reminders").select("unsubscribed_at").maybeSingle();
  return json({ active: !!data && !data.unsubscribed_at });
}

const Body = z.strictObject({ consent: z.literal(true) });

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  if (!Body.safeParse(await readJson(request).catch(() => null)).success) return problem(400, "Tick the box to agree to the daily emails.");
  if (!session.user.email) return problem(400, "Your account has no email address.");
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
