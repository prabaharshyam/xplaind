import { publicSupabase } from "@/lib/signups";

// Accounts switch on only when the Supabase settings exist in the environment
// (SC-1: values live in the host's settings, never in the repository). Until then
// the site works signed out, exactly as before, and account routes answer 503.
// SU-4: while sign-ups are on hold, accounts count as off too.
export function supabasePublicConfig(): { url: string; anonKey: string } | null {
  return publicSupabase();
}

export const accountsEnabled = (): boolean => supabasePublicConfig() !== null;

/** Server only. The service role bypasses row-level security; use it only for server-written rows. */
export function supabaseServiceKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}
