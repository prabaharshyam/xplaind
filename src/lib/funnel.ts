// AN-1 (2026-11-14, owner request): the purchase funnel, counted. One number per event per day in
// funnel_daily; no user id, no device id, no cookie. The owner reads it in the Supabase SQL editor.
import type { SupabaseClient } from "@supabase/supabase-js";

export const FUNNEL_EVENTS = ["signup", "first_lesson", "ai_trial_used", "pricing_view", "checkout_start", "purchase", "referral_visit"] as const;
export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];
/** Events the browser may report; the rest are counted on the server where they happen. */
export const BROWSER_EVENTS: readonly FunnelEvent[] = ["first_lesson", "pricing_view"];

export const isBrowserEvent = (v: unknown): v is FunnelEvent => typeof v === "string" && (BROWSER_EVENTS as readonly string[]).includes(v);

/** Adds one to today's count. Never throws: counting must not break the thing being counted. */
export async function bump(admin: SupabaseClient | null, event: FunnelEvent): Promise<void> {
  if (!admin) return;
  await admin.rpc("funnel_bump", { p_event: event }).then(
    () => undefined,
    () => undefined,
  );
}
