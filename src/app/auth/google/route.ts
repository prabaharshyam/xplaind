// AC-1a: Sign in with Google from Google's own button on xplaind.in. The browser posts the ID
// token Google issued, and the raw nonce it was bound to; Supabase checks both and starts the
// session, so the visitor never sees the Supabase address. A plain form post, like the others.
// AC-1b: on phones Google's same-tab mode posts here directly from accounts.google.com, with the
// nonce and return page in a short-lived cookie set by the button.
import { type NextRequest, NextResponse } from "next/server";
import { GOOGLE_STATE_COOKIE, parseGoogleIdForm, parseGoogleRedirectForm } from "@/lib/account/auth-forms";
import { GOOGLE_CODE_COOKIE, GOOGLE_TOKEN_URL, googleCodeConfig, readCodeCookie } from "@/lib/account/google-code";
import { siteUrl } from "@/lib/site";
import { finishSignIn } from "@/lib/account/finish";
import { safeNext } from "@/lib/account/http";
import { accountsEnabled } from "@/lib/supabase/config";
import { adminClient, userClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const fromGoogle = form.has("g_csrf_token");
  const parsed = fromGoogle
    ? parseGoogleRedirectForm(form, { state: request.cookies.get(GOOGLE_STATE_COOKIE)?.value, csrf: request.cookies.get("g_csrf_token")?.value })
    : parseGoogleIdForm(form);
  const next = safeNext(parsed.ok ? (parsed.next ?? null) : typeof form.get("next") === "string" ? String(form.get("next")) : null);
  const done = (res: NextResponse) => {
    if (fromGoogle) res.cookies.set(GOOGLE_STATE_COOKIE, "", { path: "/auth/google", maxAge: 0, secure: true, sameSite: "none" });
    return res;
  };
  const back = (error: string) => done(NextResponse.redirect(new URL(`/signin?${new URLSearchParams({ error, next })}`, request.url), 303));
  if (!accountsEnabled()) return back("off");
  if (!parsed.ok) return back(parsed.error);

  const client = await userClient();
  const admin = adminClient();
  if (!client || !admin) return back("off");
  const { error } = await client.auth.signInWithIdToken({ provider: "google", token: parsed.credential, nonce: parsed.nonce });
  if (error) return back("provider");

  if ((await finishSignIn(client, admin, new Date().toISOString())) !== "ok") return back("adult");
  return done(NextResponse.redirect(new URL(next, request.url), 303));
}

/**
 * AC-1c: Google's answer to the code flow started by /auth/oauth. The code is swapped for an ID token
 * with the client secret (server to server), and Supabase starts the session from that token, as for
 * the button. Continuing with Google is the 18+ confirmation, as the line under the buttons says.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const saved = readCodeCookie(request.cookies.get(GOOGLE_CODE_COOKIE)?.value, url.searchParams.get("state"));
  const next = safeNext(saved?.next ?? null);
  const back = (error: string) => {
    const res = NextResponse.redirect(new URL(`/signin?${new URLSearchParams({ error, next })}`, request.url), 303);
    res.cookies.set(GOOGLE_CODE_COOKIE, "", { path: "/auth/google", maxAge: 0, secure: true, sameSite: "lax" });
    return res;
  };
  if (!accountsEnabled()) return back("off");
  const google = googleCodeConfig(process.env, url.origin, siteUrl());
  const code = url.searchParams.get("code");
  if (!google || !saved || !code) return back("provider");

  let token: string | undefined;
  try {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: google.clientId, client_secret: google.clientSecret, redirect_uri: google.redirectUri, grant_type: "authorization_code" }),
      signal: AbortSignal.timeout(10_000),
    });
    token = res.ok ? ((await res.json()) as { id_token?: string }).id_token : undefined;
  } catch {
    token = undefined;
  }
  if (!token) return back("provider");

  const client = await userClient();
  const admin = adminClient();
  if (!client || !admin) return back("off");
  const { error } = await client.auth.signInWithIdToken({ provider: "google", token, nonce: saved.nonce });
  if (error) return back("provider");
  if ((await finishSignIn(client, admin, new Date().toISOString())) !== "ok") return back("adult");
  const res = NextResponse.redirect(new URL(next, request.url), 303);
  res.cookies.set(GOOGLE_CODE_COOKIE, "", { path: "/auth/google", maxAge: 0, secure: true, sameSite: "lax" });
  return res;
}
