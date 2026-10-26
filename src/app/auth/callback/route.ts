// The sign-in link lands here. Exchange it for a session, create the profile
// with the 18+ timestamp (AC-1), then go on, by default to the dashboard, where
// the device's result and progress are claimed (AC-2).
import { type NextRequest, NextResponse } from "next/server";
import { safeNext } from "@/lib/account/http";
import { ensureProfile } from "@/lib/account/repo";
import { adminClient, userClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const fail = (code: string) => NextResponse.redirect(new URL(`/signin?error=${code}`, request.url), 303);
  const client = await userClient();
  const admin = adminClient();
  if (!client || !admin) return fail("off");

  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const { error } = code
    ? await client.auth.exchangeCodeForSession(code)
    : tokenHash
      ? await client.auth.verifyOtp({ type: "email", token_hash: tokenHash })
      : { error: new Error("no code") };
  if (error) return fail("link");

  const { data } = await client.auth.getUser();
  const adultAt = data.user?.user_metadata?.adult_confirmed_at;
  if (!data.user || typeof adultAt !== "string") {
    await client.auth.signOut();
    return fail("adult");
  }
  await ensureProfile(admin, data.user.id, adultAt);
  return NextResponse.redirect(new URL(safeNext(params.get("next")), request.url), 303);
}
