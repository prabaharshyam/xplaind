// VI-3: who may use the AI voice interviewer. Node only. Checked before any request body is read, so a
// guest or free account never costs a model call (the MB-12 pattern).
import type { SupabaseClient } from "@supabase/supabase-js";
import { json, problem } from "@/lib/account/http";
import { proOpen } from "@/lib/billing/config";
import { accountsEnabled } from "@/lib/supabase/config";
import { serviceClient } from "@/lib/supabase/server";
import { LIMIT_MESSAGE } from "./limits";
import { aiSettings } from "./settings";
import { VOICE_PRO_ONLY } from "./voice-interview";
import { aiCaller } from "./who";

/** The service client when this caller may use the voice interviewer, otherwise the Response to send. */
export async function voiceAccess(): Promise<{ admin: SupabaseClient } | Response> {
  const admin = serviceClient();
  if (!aiSettings() || !admin) return problem(503, LIMIT_MESSAGE.off);
  const who = await aiCaller(admin);
  // PV-2: accounts are for adults only, so needing Pro (an account) keeps under-18s out as well.
  if (who.guest && accountsEnabled()) return json({ error: LIMIT_MESSAGE.signin, signin: true }, 401);
  if (who.tier !== "pro") return json({ error: VOICE_PRO_ONLY, ...(proOpen() ? { upgrade: "/pricing" } : {}) }, 403);
  return { admin };
}
