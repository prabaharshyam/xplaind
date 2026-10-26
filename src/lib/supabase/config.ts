// Accounts switch on only when the Supabase settings exist in the environment
// (SC-1: values live in the host's settings, never in the repository). Until then
// the site works signed out, exactly as before, and account routes answer 503.
export function supabasePublicConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

export const accountsEnabled = (): boolean => supabasePublicConfig() !== null;

/** Server only. The service role bypasses row-level security; use it only for server-written rows. */
export function supabaseServiceKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}
