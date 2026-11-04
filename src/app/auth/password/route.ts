// AC-1: sign up or sign in with email and password. A plain form POST, so it works with JavaScript off.
import { type NextRequest, NextResponse } from "next/server";
import { parsePasswordForm, signUpHitExistingAccount } from "@/lib/account/auth-forms";
import { finishSignIn } from "@/lib/account/finish";
import { ipKey, rateLimit, safeNext } from "@/lib/account/http";
import { accountsEnabled } from "@/lib/supabase/config";
import { adminClient, userClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const next = safeNext(typeof form.get("next") === "string" ? String(form.get("next")) : null);
  const back = (params: Record<string, string>) =>
    NextResponse.redirect(new URL(`/signin?${new URLSearchParams({ ...params, next })}`, request.url), 303);
  if (!accountsEnabled()) return back({ error: "off" });
  const parsed = parsePasswordForm(form);
  if (!parsed.ok) return back({ error: parsed.error, mode: String(form.get("mode") ?? "signup") });

  const admin = adminClient();
  const client = await userClient();
  if (!admin || !client) return back({ error: "off" });
  if (await rateLimit(admin, `password:${ipKey(request)}`, 600, 10)) return back({ error: "busy" });

  const { email, password, mode } = parsed.data;
  if (mode === "signin") {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return back({ error: "wrong", mode });
  } else {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: new URL(`/auth/callback?next=${encodeURIComponent(next)}`, request.url).toString(),
        data: { adult_confirmed_at: new Date().toISOString() },
      },
    });
    if (error) return back({ error: /registered|exists/i.test(error.message) ? "taken" : "send", mode });
    if (signUpHitExistingAccount(data.user)) return back({ error: "taken", mode: "signin" });
    // With "Confirm email" on in Supabase, there is no session until the learner opens the email.
    if (!data.session) return back({ sent: "confirm" });
  }
  if ((await finishSignIn(client, admin)) !== "ok") return back({ error: "adult" });
  return NextResponse.redirect(new URL(next, request.url), 303);
}
