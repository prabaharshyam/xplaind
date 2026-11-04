// AC-1a: Sign in with Google from Google's own button on xplaind.in. The browser posts the ID
// token Google issued, and the raw nonce it was bound to; Supabase checks both and starts the
// session, so the visitor never sees the Supabase address. A plain form post, like the others.
import { type NextRequest, NextResponse } from "next/server";
import { parseGoogleIdForm } from "@/lib/account/auth-forms";
import { finishSignIn } from "@/lib/account/finish";
import { safeNext } from "@/lib/account/http";
import { accountsEnabled } from "@/lib/supabase/config";
import { adminClient, userClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const next = safeNext(typeof form.get("next") === "string" ? String(form.get("next")) : null);
  const back = (error: string) => NextResponse.redirect(new URL(`/signin?${new URLSearchParams({ error, next })}`, request.url), 303);
  if (!accountsEnabled()) return back("off");
  const parsed = parseGoogleIdForm(form);
  if (!parsed.ok) return back(parsed.error);

  const client = await userClient();
  const admin = adminClient();
  if (!client || !admin) return back("off");
  const { error } = await client.auth.signInWithIdToken({ provider: "google", token: parsed.credential, nonce: parsed.nonce });
  if (error) return back("provider");

  if ((await finishSignIn(client, admin, new Date().toISOString())) !== "ok") return back("adult");
  return NextResponse.redirect(new URL(next, request.url), 303);
}
