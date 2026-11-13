// Who is calling an AI helper, and on which tier of daily limits (SU-5, PAY-1). Node only.
import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { visitorKey } from "@/lib/account/http";
import { proOpen } from "@/lib/billing/config";
import { type Tier, dailyLimit, passIsActive, trialLeftToday } from "@/lib/billing/plans";
import { accountsEnabled } from "@/lib/supabase/config";
import { currentUser, userClient } from "@/lib/supabase/server";
import { type AiKind, DAILY_LIMIT } from "./limits";

export type Caller = { guest: boolean; id: string; tier: Tier };

/**
 * A signed-in learner with an 18+ profile (PV-2) uses their own allowance, and a higher one while
 * their pass runs. Anyone else, including everyone while sign-ups are on hold, is a guest counted
 * by a hash of their address that changes daily, so no one can be tracked over time.
 */
export async function aiCaller(admin: SupabaseClient, now = new Date()): Promise<Caller> {
  if (accountsEnabled()) {
    const client = await userClient();
    const user = client ? await currentUser(client) : null;
    if (user) {
      const { data: profile } = await admin.from("profiles").select("id").eq("id", user.id).maybeSingle();
      if (profile) {
        const { data: pass } = await admin.from("entitlements").select("valid_until").eq("user_id", user.id).maybeSingle();
        const pro = passIsActive(pass?.valid_until, now.getTime());
        return { guest: false, id: user.id, tier: pro ? "pro" : "free" };
      }
    }
  }
  return { guest: true, id: visitorKey(await headers()), tier: "guest" };
}

/** Today's limit for this caller and feature (for a free account: the whole trial). */
export const limitFor = (kind: AiKind, who: Caller): number => dailyLimit(kind, who.tier, proOpen(), DAILY_LIMIT);

/** PAY-7: a free account is on a one-time trial per feature while Pro is open. */
export const onTrial = (who: Caller): boolean => !who.guest && who.tier === "free" && proOpen();

/** How many uses of this feature the account made before today. */
export async function usedBefore(admin: SupabaseClient, who: Caller, kind: AiKind, day: string): Promise<number> {
  const { data } = await admin.from("ai_usage").select("calls").eq("user_id", who.id).eq("kind", kind).lt("day", day);
  return (data ?? []).reduce((n: number, r: { calls: number | null }) => n + (r.calls ?? 0), 0);
}

/** The most this caller may use the feature today: the daily limit, or for a trial what is left of it. */
export async function allowanceToday(admin: SupabaseClient, who: Caller, kind: AiKind, day: string): Promise<number> {
  const limit = limitFor(kind, who);
  return onTrial(who) ? trialLeftToday(limit, await usedBefore(admin, who, kind, day)) : limit;
}
