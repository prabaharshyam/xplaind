// RF-1 (2026-11-14, owner decision): referrals. A learner shares /r/<code>. A friend who opens it
// gets 10% off their first pass; when the friend pays, the learner who shared gets 7 more days of Pro
// (in grant_pass, once per friend, never for yourself). Pure helpers plus the two lookups the routes need.
import type { SupabaseClient } from "@supabase/supabase-js";

export const REF_COOKIE = "xp_ref";
export const REF_PERCENT = 10;
export const REF_REWARD_DAYS = 7;
/** How long a shared link counts after it is opened. */
export const REF_COOKIE_DAYS = 30;

/** A code as typed or stored: lower case letters and digits, 6 to 12 long. Null if it cannot be one. */
export function normaliseRefCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const c = raw.trim().toLowerCase();
  return /^[a-z0-9]{6,12}$/.test(c) ? c : null;
}

/** A new code from random bytes: 8 characters, no look-alike letters (0/o, 1/l/i). Pure given the bytes. */
export function makeRefCode(bytes: Uint8Array): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(bytes.slice(0, 8), (b) => alphabet[b % alphabet.length]).join("");
}

/** The learner's own code, made the first time it is asked for. Service role. */
export async function ownRefCode(admin: SupabaseClient, userId: string, random: () => Uint8Array): Promise<string | null> {
  const { data } = await admin.from("referral_codes").select("code").eq("user_id", userId).maybeSingle();
  if (data?.code) return data.code;
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = makeRefCode(random());
    const { error } = await admin.from("referral_codes").insert({ user_id: userId, code });
    if (!error) return code;
  }
  return null;
}

/**
 * Whether this buyer gets the friend discount, and whose code it was: the code must exist, belong to
 * someone else, and the buyer must never have paid for a pass before. Service role.
 */
export async function referralFor(admin: SupabaseClient, rawCode: unknown, buyerId: string): Promise<{ referrer: string } | null> {
  const code = normaliseRefCode(rawCode);
  if (!code) return null;
  const { data: owner } = await admin.from("referral_codes").select("user_id").eq("code", code).maybeSingle();
  if (!owner || owner.user_id === buyerId) return null;
  const { count } = await admin.from("payments").select("order_id", { count: "exact", head: true }).eq("user_id", buyerId).eq("status", "paid");
  if ((count ?? 0) > 0) return null;
  return { referrer: owner.user_id };
}
