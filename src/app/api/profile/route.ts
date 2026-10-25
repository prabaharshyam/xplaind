// Settings: the learner's weekly-hours goal (AC-3). Written with their own client;
// the column grants allow only goal_id and weekly_hours.
import { z } from "zod";
import { json, problem, readJson, requireSession } from "@/lib/account/http";

const Body = z.strictObject({ weeklyHours: z.number().int().min(1).max(40) });

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const parsed = Body.safeParse(await readJson(request).catch(() => null));
  if (!parsed.success) return problem(400, "Choose between 1 and 40 hours a week.");
  const { error } = await session.client.from("profiles").update({ weekly_hours: parsed.data.weeklyHours }).eq("id", session.user.id);
  if (error) return problem(500, "Could not save.");
  return json({ ok: true });
}
