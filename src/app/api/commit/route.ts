// CM-90: opt in to, read, or stop the 90-day weekly emails. The session is checked here; the
// row is written with the service role (the learner can only read it under RLS).
import { z } from "zod";
import { json, problem, readJson, requireSession } from "@/lib/account/http";
import { COMMIT_CONSENT, weekOf } from "@/lib/commit/plan";
import { getPath } from "@/lib/content";
import { todayInIST } from "@/lib/dates";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { data } = await session.client.from("commitments").select("path_id, started_on, last_sent_week, unsubscribed_at").maybeSingle();
  if (!data || data.unsubscribed_at) return json({ active: false });
  return json({ active: true, pathId: data.path_id, week: Math.min(13, weekOf(data.started_on, todayInIST())) });
}

const Body = z.strictObject({ pathId: z.string().max(60), consent: z.literal(true) });

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const parsed = Body.safeParse(await readJson(request).catch(() => null));
  if (!parsed.success) return problem(400, "Tick the box to agree to the weekly emails.");
  if (!getPath(parsed.data.pathId)) return problem(400, "That path does not exist.");
  if (!session.user.email) return problem(400, "Your account has no email address.");
  const { error } = await session.admin.from("commitments").upsert(
    {
      user_id: session.user.id,
      path_id: parsed.data.pathId,
      email: session.user.email,
      started_on: todayInIST(),
      consent_text: COMMIT_CONSENT,
      consent_at: new Date().toISOString(),
      last_sent_week: 0,
      last_sent_at: null,
      unsubscribed_at: null,
    },
    { onConflict: "user_id" },
  );
  if (error) return problem(500, "Could not save. Please try again.");
  return json({ ok: true });
}

export async function DELETE() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { error } = await session.admin.from("commitments").update({ unsubscribed_at: new Date().toISOString() }).eq("user_id", session.user.id);
  if (error) return problem(500, "Could not stop the emails. Please try again.");
  return json({ ok: true });
}
