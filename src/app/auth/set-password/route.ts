// Settings: set or change the password, for example after signing in with Google or an email link.
import { type NextRequest, NextResponse } from "next/server";
import { parseNewPassword } from "@/lib/account/auth-forms";
import { userClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const done = (status: string) => NextResponse.redirect(new URL(`/settings?password=${status}`, request.url), 303);
  const client = await userClient();
  if (!client) return done("off");
  const { data } = await client.auth.getUser();
  if (!data.user) return NextResponse.redirect(new URL("/signin?next=/settings", request.url), 303);
  const parsed = parseNewPassword(await request.formData());
  if (!parsed.ok) return done("short");
  const { error } = await client.auth.updateUser({ password: parsed.password });
  return done(error ? "failed" : "saved");
}
