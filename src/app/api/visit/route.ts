// ST-1: a signed-in learner opened the site today. That counts as an activity day (AC-6), and the reply carries
// every day on record, so a new device or browser starts with the same streak.
import { json, problem, rateLimit, requireSession } from "@/lib/account/http";
import { recordActivity } from "@/lib/account/repo";
import { todayInIST } from "@/lib/dates";

export async function POST() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { user, client, admin } = session;
  const limited = await rateLimit(admin, `visit:${user.id}`, 600, 20);
  if (limited) return limited;
  await recordActivity(admin, user.id, [todayInIST()]);
  const { data, error } = await client.from("activity_days").select("day").eq("user_id", user.id).order("day", { ascending: false }).limit(400);
  if (error) return problem(500, "Could not load.");
  return json({ days: (data ?? []).map((r: { day: string }) => r.day) });
}
