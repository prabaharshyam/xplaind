// Who is calling an AI helper, and on which tier of daily limits (SU-5, PAY-1). Node only.
import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { visitorKey } from "@/lib/account/http";
import { proOpen } from "@/lib/billing/config";
import { type Tier, dailyLimit, passIsActive } from "@/lib/billing/plans";
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

/** Today's limit for this caller and feature. */
export const limitFor = (kind: AiKind, who: Caller): number => dailyLimit(kind, who.tier, proOpen(), DAILY_LIMIT);
