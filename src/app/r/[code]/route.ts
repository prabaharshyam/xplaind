// RF-1: a shared referral link. Remembers the code for 30 days (a first-party cookie read only when
// paying), counts the visit (AN-1, no identifiers) and opens the home page.
import { NextResponse } from "next/server";
import { bump } from "@/lib/funnel";
import { REF_COOKIE, REF_COOKIE_DAYS, normaliseRefCode } from "@/lib/billing/referral";
import { serviceClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = normaliseRefCode((await params).code);
  const res = NextResponse.redirect(new URL("/", request.url));
  if (!code) return res;
  res.cookies.set(REF_COOKIE, code, { maxAge: REF_COOKIE_DAYS * 24 * 3600, path: "/", httpOnly: true, sameSite: "lax", secure: new URL(request.url).protocol === "https:" });
  await bump(serviceClient(), "referral_visit");
  return res;
}
