// Settings: the learner's weekly-hours goal (AC-3), chosen path and last lesson (AC-6). Written with their own client;
// the column grants allow only these columns.
import { z } from "zod";
import { json, problem, readJson, requireSession } from "@/lib/account/http";
import { getPath, getStop } from "@/lib/content";

const Body = z
  .strictObject({ weeklyHours: z.number().int().min(1).max(40).optional(), goalId: z.string().max(64).optional(), lastStopId: z.string().max(80).optional() })
  .refine((b) => b.weeklyHours !== undefined || b.goalId !== undefined || b.lastStopId !== undefined);

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const parsed = Body.safeParse(await readJson(request).catch(() => null));
  if (!parsed.success) return problem(400, "Choose between 1 and 40 hours a week.");
  const { weeklyHours, goalId, lastStopId } = parsed.data;
  if (goalId !== undefined && !getPath(goalId)) return problem(400, "That path does not exist.");
  if (lastStopId !== undefined && !getStop(lastStopId)) return problem(400, "That lesson does not exist.");
  const change = {
    ...(weeklyHours !== undefined ? { weekly_hours: weeklyHours } : {}),
    ...(goalId !== undefined ? { goal_id: goalId } : {}),
    // AC-6: the lesson to carry on from on any device.
    ...(lastStopId !== undefined ? { last_stop_id: lastStopId, last_stop_at: new Date().toISOString() } : {}),
  };
  const { error } = await session.client.from("profiles").update(change).eq("id", session.user.id);
  if (error) return problem(500, "Could not save.");
  return json({ ok: true });
}
