// AN-1: the browser reports the two funnel steps only it sees (first lesson done, pricing page seen).
// Counted per day with no identifier; anything else is refused.
import { ipKey, json, problem, rateLimit, readJson } from "@/lib/account/http";
import { bump, isBrowserEvent } from "@/lib/funnel";
import { serviceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await readJson(request, 200).catch(() => null)) as { event?: unknown } | null;
  if (!body || !isBrowserEvent(body.event)) return problem(400, "Unknown event.");
  // SC-3: counted per day with no identifier, but a script must not be able to write to the database without limit.
  const admin = serviceClient();
  if (admin) {
    const limited = await rateLimit(admin, `funnel:${ipKey(request)}`, 60, 20);
    if (limited) return limited;
  }
  await bump(admin, body.event);
  return json({ ok: true });
}
