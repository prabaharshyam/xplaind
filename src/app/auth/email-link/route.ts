// AC-1: send a sign-in link by email, never without the "I am 18 or older" tick.
// A plain form POST, so it works with JavaScript off.
import { type NextRequest, NextResponse } from "next/server";
import { parseEmailLinkForm } from "@/lib/account/email-link";
import { ipKey, rateLimit, safeNext } from "@/lib/account/http";
import { accountsEnabled } from "@/lib/supabase/config";
import { adminClient, userClient } from "@/lib/supabase/server";

const back = (request: NextRequest, params: Record<string, string>) =>
  NextResponse.redirect(new URL(`/signin?${new URLSearchParams(params)}`, request.url), 303);

export async function POST(request: NextRequest) {
  if (!accountsEnabled()) return back(request, { error: "off" });
  const parsed = parseEmailLinkForm(await request.formData());
  if (!parsed.ok) return back(request, { error: parsed.error });

  const admin = adminClient();
  if (admin) {
    const limited = await rateLimit(admin, `email-link:${ipKey(request)}`, 600, 5);
    if (limited) return back(request, { error: "busy" });
  }

  const client = await userClient();
  const next = safeNext(parsed.data.next);
  const { error } = await client!.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: new URL(`/auth/callback?next=${encodeURIComponent(next)}`, request.url).toString(),
      shouldCreateUser: true,
      // Stored on the auth user, then copied to profiles.adult_confirmed_at on first sign-in.
      data: { adult_confirmed_at: new Date().toISOString() },
    },
  });
  if (error) return back(request, { error: "send" });
  return back(request, { sent: "1" });
}
