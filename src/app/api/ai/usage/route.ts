// PAY-4: how many AI turns this visitor has left today for one feature, for the counter on the
// AI pages. Shown only once Pro is open; it never spends anything.
import { json } from "@/lib/account/http";
import { AI_KINDS, type AiKind, GUEST_SAMPLE } from "@/lib/ai/limits";
import { accountsEnabled } from "@/lib/supabase/config";
import { aiSettings } from "@/lib/ai/settings";
import { aiCaller, limitFor } from "@/lib/ai/who";
import { proOpen } from "@/lib/billing/config";
import { todayInIST } from "@/lib/dates";
import { serviceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const kind = new URL(request.url).searchParams.get("kind") as AiKind | null;
  const admin = serviceClient();
  if (!kind || !AI_KINDS.includes(kind) || !admin || !aiSettings() || !proOpen()) return json({ show: false });
  const who = await aiCaller(admin);
  const day = todayInIST();
  // AG-1: a guest's free try is shared across every AI tool once sign-ups are open.
  if (who.guest && accountsEnabled()) {
    const { data: rows } = await admin.from("ai_guest_usage").select("calls").eq("visitor", who.id).eq("day", day);
    const used = (rows ?? []).reduce((n, r) => n + (r.calls ?? 0), 0);
    return json({ show: true, tier: who.tier, used: Math.min(GUEST_SAMPLE, used), limit: GUEST_SAMPLE }, 200);
  }
  const { data } = who.guest
    ? await admin.from("ai_guest_usage").select("calls").eq("visitor", who.id).eq("day", day).eq("kind", kind).maybeSingle()
    : await admin.from("ai_usage").select("calls").eq("user_id", who.id).eq("day", day).eq("kind", kind).maybeSingle();
  const limit = limitFor(kind, who);
  return json({ show: true, tier: who.tier, used: Math.min(limit, data?.calls ?? 0), limit }, 200);
}
