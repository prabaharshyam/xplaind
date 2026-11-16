// AC-1a: Sign in with Google from Google's own button on xplaind.in. The browser posts the ID
// token Google issued, and the raw nonce it was bound to; Supabase checks both and starts the
// session, so the visitor never sees the Supabase address. A plain form post, like the others.
// AC-1b: on phones Google's same-tab mode posts here directly from accounts.google.com, with the
// nonce and return page in a short-lived cookie set by the button.
import { type NextRequest, NextResponse } from "next/server";
import { GOOGLE_STATE_COOKIE, parseGoogleIdForm, parseGoogleRedirectForm } from "@/lib/account/auth-forms";
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
