// AC-1: "Continue with Google / GitHub". A plain form POST, so it works with JavaScript off.
// The 18+ tick rides in a short-lived cookie to the callback, which stores it on the profile.
import { type NextRequest, NextResponse } from "next/server";
import { ADULT_COOKIE, parseOAuthForm } from "@/lib/account/auth-forms";
import { safeNext } from "@/lib/account/http";
import { accountsEnabled } from "@/lib/supabase/config";
import { userClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const next = safeNext(typeof form.get("next") === "string" ? String(form.get("next")) : null);
  const back = (error: string) => NextResponse.redirect(new URL(`/signin?${new URLSearchParams({ error, next })}`, request.url), 303);
  if (!accountsEnabled()) return back("off");
  const parsed = parseOAuthForm(form);
  if (!parsed.ok) return back(parsed.error);

  const client = await userClient();
  const { data, error } = await client!.auth.signInWithOAuth({
    provider: parsed.provider,
    options: {
      redirectTo: new URL(`/auth/callback?next=${encodeURIComponent(next)}`, request.url).toString(),
      skipBrowserRedirect: true,
    },
  });
  if (error || !data.url) return back("provider");

  const res = NextResponse.redirect(data.url, 303);
  res.cookies.set(ADULT_COOKIE, new Date().toISOString(), { httpOnly: true, sameSite: "lax", secure: true, path: "/auth", maxAge: 600 });
  return res;
}
