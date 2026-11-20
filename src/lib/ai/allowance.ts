// PAY-13: whether a Pro learner still has AI allowance in the last 30 days. Node only.
import type { SupabaseClient } from "@supabase/supabase-js";
import { AI_ALLOWANCE_WINDOW_DAYS, aiAllowanceUsd } from "@/lib/billing/ai-allowance";

/** The first day (YYYY-MM-DD) of the 30-day window ending on `day`. */
export function windowStart(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - (AI_ALLOWANCE_WINDOW_DAYS - 1));
  return d.toISOString().slice(0, 10);
}

/** True when the learner's recorded AI cost over the window has reached their pass's allowance. Fails open. */
export async function proAllowanceUsed(admin: SupabaseClient, userId: string, day: string): Promise<boolean> {
  const [pay, usage] = await Promise.all([
    admin.from("payments").select("plan_id, amount_paise").eq("user_id", userId).eq("status", "paid").order("paid_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("ai_usage").select("cost_usd").eq("user_id", userId).gte("day", windowStart(day)),
  ]);
  // If either lookup fails, let the call through: the daily limits and the kill switch still apply.
  if (pay.error || usage.error) return false;
  const spent = ((usage.data ?? []) as { cost_usd: number | string | null }[]).reduce((n, r) => n + Number(r.cost_usd ?? 0), 0);
  const p = pay.data as { plan_id?: string; amount_paise?: number } | null;
  return spent >= aiAllowanceUsd(p?.amount_paise, p?.plan_id);
}
