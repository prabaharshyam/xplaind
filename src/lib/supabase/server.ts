// Supabase clients for server code. Node only.
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabasePublicConfig, supabaseServiceKey } from "./config";

/** The signed-in learner's client: every query runs under their row-level security. */
export async function userClient(): Promise<SupabaseClient | null> {
  const config = supabasePublicConfig();
  if (!config) return null;
  const store = await cookies();
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component, which cannot set cookies. The proxy refreshes sessions instead.
        }
      },
    },
  });
}

/** The service-role client. Bypasses row-level security: only for rows the PRD says the server writes. */
export function adminClient(): SupabaseClient | null {
  const config = supabasePublicConfig();
  const key = supabaseServiceKey();
  if (!config || !key) return null;
  return createClient(config.url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** The signed-in user's id, checked with the auth server (not just read from the cookie). */
export async function currentUser(client: SupabaseClient): Promise<{ id: string; email: string | null } | null> {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}
