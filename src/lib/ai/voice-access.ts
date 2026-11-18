// VI-3: who may use the AI voice interviewer. Node only. Checked before any request body is read, so a
// visitor who may not use it never costs a model call (the MB-12 pattern).
// VI-13 (2026-11-17, owner request): a free account also gets one free 2-question interview while Pro is
// open (PAY-7). The gate is Pro or onTrial, never "any free account": before Pro opens, the daily limits
// are the same for everyone, so a looser gate would hand every account the Pro allowance.
import type { SupabaseClient } from "@supabase/supabase-js";
import { json, problem } from "@/lib/account/http";
import { proOpen } from "@/lib/billing/config";
import { accountsEnabled } from "@/lib/supabase/config";
import { serviceClient } from "@/lib/supabase/server";
import { todayInIST } from "@/lib/dates";
import { type AiKind, LIMIT_MESSAGE, monthStart } from "./limits";
import { aiSettings } from "./settings";
import { VOICE_PRO_ONLY } from "./voice-interview";
import { aiCaller, allowanceToday, onTrial, type Caller } from "./who";

export type VoiceAccess = { admin: SupabaseClient; who: Caller; trial: boolean };

const proOnly = (message = VOICE_PRO_ONLY) => json({ error: message, ...(proOpen() ? { upgrade: "/pricing" } : {}) }, 403);
/** The trial is used up: the browser offers the pricing page. */
export const trialUsed = () => json({ error: LIMIT_MESSAGE.voiceTrial, upgrade: "/pricing", trialUsed: true }, 429);

/** The service client when this caller may use the voice interviewer, otherwise the Response to send. */
export async function voiceAccess(opts: { proOnly?: string } = {}): Promise<VoiceAccess | Response> {
  const admin = serviceClient();
  if (!aiSettings() || !admin) return problem(503, LIMIT_MESSAGE.off);
  const who = await aiCaller(admin);
  // PV-2: accounts are for adults only, so needing an account keeps under-18s out as well.
  if (who.guest && accountsEnabled()) return json({ error: LIMIT_MESSAGE.signin, signin: true }, 401);
  if (who.tier === "pro") return { admin, who, trial: false };
  if (!onTrial(who) || opts.proOnly) return proOnly(opts.proOnly);
  return { admin, who, trial: true };
}

/**
 * VI-13: whether this free account still has its free interview: no report asked for yet. The report
 * allowance is 2 so a failed report can be retried, but any use closes new interviews. Reads only.
 */
export async function trialLeft(access: VoiceAccess): Promise<boolean> {
  const { data } = await access.admin.from("ai_usage").select("calls").eq("user_id", access.who.id).eq("kind", "voice_trial");
  return (data ?? []).reduce((n: number, r: { calls: number | null }) => n + (r.calls ?? 0), 0) === 0;
}

/**
 * Counts one use of a trial allowance that has no model call of its own (an interview started). Returns
 * null when it was counted, otherwise the Response to send. Fails closed.
 */
export async function reserveTrial(access: VoiceAccess, kind: AiKind): Promise<Response | null> {
  const settings = aiSettings();
  if (!settings) return problem(503, LIMIT_MESSAGE.off);
  const day = todayInIST();
  const { data, error } = await access.admin.rpc("ai_reserve", {
    p_user: access.who.id,
    p_kind: kind,
    p_day: day,
    p_month_start: monthStart(day),
    p_daily_max: await allowanceToday(access.admin, access.who, kind, day),
    p_month_cap_usd: settings.monthlyCapUsd,
  });
  if (error) return problem(503, "AI is not available right now. Please try again later.");
  if (data === "ok") return null;
  if (data === "month") return problem(429, LIMIT_MESSAGE.month);
  return trialUsed();
}
