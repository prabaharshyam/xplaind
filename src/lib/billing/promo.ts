// PAY-9: promo codes. Pure parts (normalising a code, pricing a discount) and the one database check
// the order route needs. Codes live only in the database (the repository is public).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanId } from "./plans";

/** What a learner typed, as stored: trimmed, lower case, letters and digits only. Null if it cannot be a code. */
export function normaliseCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const c = raw.trim().toLowerCase();
  return /^[a-z0-9]{3,32}$/.test(c) ? c : null;
}

/** The price after a percentage off, in whole paise. 100% is free. Pure. */
export const discountedPaise = (paise: number, percentOff: number): number =>
  percentOff >= 100 ? 0 : Math.round((paise * (100 - Math.max(0, percentOff))) / 100);

export type PromoCheck = { ok: true; code: string; percentOff: number } | { ok: false; reason: string };

/** Whether this account may use this code on this plan now. Service role only. */
export async function checkPromo(admin: SupabaseClient, rawCode: unknown, planId: PlanId, userId: string, now = new Date()): Promise<PromoCheck> {
  const code = normaliseCode(rawCode);
  if (!code) return { ok: false, reason: "That promo code is not valid." };
  const { data: promo } = await admin.from("promo_codes").select("code, percent_off, plan_ids, active, expires_at").eq("code", code).maybeSingle();
  if (!promo || !promo.active) return { ok: false, reason: "That promo code is not valid." };
  if (promo.expires_at && new Date(promo.expires_at).getTime() <= now.getTime()) return { ok: false, reason: "That promo code has expired." };
  if (!Array.isArray(promo.plan_ids) || !promo.plan_ids.includes(planId)) return { ok: false, reason: "That promo code works only on the 30-day pass." };
  const { data: used } = await admin.from("promo_redemptions").select("code").eq("user_id", userId).eq("code", code).maybeSingle();
  if (used) return { ok: false, reason: "You have already used this promo code." };
  return { ok: true, code, percentOff: promo.percent_off };
}
