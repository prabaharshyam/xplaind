// AC-4: set one stop's status, check score or project link. Any change that
// counts records an activity day (AC-6), and badges are rechecked (AC-6).
import { z } from "zod";
import { StopProgressInput } from "@/lib/account/claim";
import { json, problem, rateLimit, readJson, requireSession } from "@/lib/account/http";
import { loadState, progressToRow, recordActivity, refreshBadges } from "@/lib/account/repo";
import { getStop } from "@/lib/content";
import { todayInIST } from "@/lib/dates";

const Body = z.strictObject({ stopId: z.string().max(80), record: StopProgressInput.nullable() });

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { user, client, admin } = session;
  const limited = await rateLimit(admin, `progress:${user.id}`, 600, 120);
  if (limited) return limited;

  const parsed = Body.safeParse(await readJson(request).catch(() => null));
  if (!parsed.success || !getStop(parsed.data.stopId)) return problem(400, "Unknown step.");
  const { stopId, record } = parsed.data;

  if (record === null) {
    const { error } = await client.from("stop_progress").delete().eq("user_id", user.id).eq("stop_id", stopId);
    if (error) return problem(500, "Could not save.");
    return json({ ok: true });
  }

  const { error } = await client.from("stop_progress").upsert(progressToRow(user.id, stopId, record));
  if (error) return problem(500, "Could not save.");
  if (record.status === "done" || record.score !== undefined) await recordActivity(admin, user.id, [todayInIST()]);
  if (record.status === "done") await refreshBadges(admin, user.id, await loadState(client, user.id));
  return json({ ok: true });
}
