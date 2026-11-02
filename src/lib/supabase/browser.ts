"use client";
// The browser client, used only to know whether someone is signed in.
// All reads and writes of learner data go through the server routes.
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicSupabase } from "@/lib/signups";

let client: SupabaseClient | null | undefined;

export function browserClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const config = publicSupabase(); // null while sign-ups are on hold (SU-4)
  client = config ? createBrowserClient(config.url, config.anonKey) : null;
  return client;
}
