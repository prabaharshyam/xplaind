// SU-4: a temporary hold on sign-ups. Until the owner finishes the sign-in set-up (Google and
// GitHub sign-in, email), the whole site runs as if accounts were off: every feature is open,
// nothing asks for an account, and progress stays on the device. To reopen sign-ups, set
// NEXT_PUBLIC_SIGNUPS_OPEN=true in the host's settings and redeploy; no code change is needed.

export function signupsOnHold(value: string | undefined = process.env.NEXT_PUBLIC_SIGNUPS_OPEN): boolean {
  return !["1", "true", "on", "yes"].includes((value ?? "").trim().toLowerCase());
}

/** The public Supabase settings, or null while they are missing or sign-ups are on hold. */
export function publicSupabase(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey && !signupsOnHold() ? { url, anonKey } : null;
}
