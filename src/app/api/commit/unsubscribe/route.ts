// CM-90: one-click unsubscribe from the link in every email (GET) and from the mail app's
// unsubscribe button (POST, RFC 8058). No sign-in needed; the token is unguessable.
import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site";

const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function stop(request: Request): Promise<boolean> {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const admin = adminClient();
  if (!TOKEN.test(token) || !admin) return false;
  const { error } = await admin.from("commitments").update({ unsubscribed_at: new Date().toISOString() }).eq("unsubscribe_token", token).is("unsubscribed_at", null);
  return !error;
}

export async function GET(request: Request) {
  const ok = await stop(request);
  return NextResponse.redirect(`${siteUrl()}/commit/stopped${ok ? "" : "?error=1"}`, 303);
}

export async function POST(request: Request) {
  const ok = await stop(request);
  return new NextResponse(null, { status: ok ? 200 : 400 });
}
