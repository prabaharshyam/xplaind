// Shared pieces for account routes. Node only.
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { accountsEnabled } from "@/lib/supabase/config";
import { adminClient, currentUser, userClient } from "@/lib/supabase/server";

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export const problem = (status: number, message: string) => json({ error: message }, status);

export type Session = { user: { id: string; email: string | null }; client: SupabaseClient; admin: SupabaseClient };

/** The signed-in learner and both clients, or an error response to return as is. */
export async function requireSession(): Promise<Session | Response> {
  if (!accountsEnabled()) return problem(503, "Accounts are not switched on yet.");
  const client = await userClient();
  const admin = adminClient();
  if (!client || !admin) return problem(503, "Accounts are not fully configured.");
  const user = await currentUser(client);
  if (!user) return problem(401, "Please sign in.");
  return { user, client, admin };
}

/** SC-3: fixed-window limit. Returns a 429 response when over, otherwise null. */
export async function rateLimit(admin: SupabaseClient, key: string, windowSeconds: number, max: number): Promise<Response | null> {
  const { data, error } = await admin.rpc("hit_rate_limit", { p_key: key, p_window_seconds: windowSeconds, p_max: max });
  if (error) return null; // Fail open: a broken limiter must not lock learners out.
  return data === false
    ? new Response(JSON.stringify({ error: "Too many requests. Please wait a few minutes." }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": String(windowSeconds) },
      })
    : null;
}

/**
 * A short hash of the caller's address for rate-limit keys. The address itself is
 * never stored, and the hash changes daily, so it cannot track anyone over time.
 */
export function ipKey(request: Request): string {
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${day}:${ip}:${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`).digest("hex").slice(0, 24);
}

/** Only same-site paths, so a sign-in link cannot redirect anywhere else. */
export function safeNext(value: string | null | undefined, fallback = "/dashboard"): string {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : fallback;
}

export async function readJson(request: Request, maxBytes = 200_000): Promise<unknown> {
  const text = await request.text();
  if (text.length > maxBytes) throw new Error("too large");
  return JSON.parse(text);
}
