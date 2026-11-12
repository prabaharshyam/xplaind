// Keeps Supabase sessions fresh on account pages and APIs (Server Components
// cannot write cookies). Static content pages are not matched, so they stay static.
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { publicSupabase } from "@/lib/signups";
import { MAX_MS, SEEN_COOKIE, sessionExpiry, signedInAtFromClaims, toMs } from "@/lib/account/session-timeout";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = publicSupabase(); // null while sign-ups are on hold (SU-4)
  if (!config) return response;
  const { url, anonKey: key } = config;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list, headers) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
        for (const [k, v] of Object.entries(headers ?? {})) response.headers.set(k, v);
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) {
    // AC-13: the same timeout as the browser, so an old session cannot keep calling the APIs.
    const now = Date.now();
    const expiry = sessionExpiry({ now, signedInAt: signedInAtFromClaims(data.claims), lastSeen: toMs(request.cookies.get(SEEN_COOKIE)?.value) });
    if (expiry) {
      await supabase.auth.signOut();
      return response;
    }
    response.cookies.set(SEEN_COOKIE, String(now), { path: "/", maxAge: MAX_MS / 1000, sameSite: "lax", secure: request.nextUrl.protocol === "https:" });
  }
  return response;
}

export const config = {
  matcher: ["/dashboard", "/settings/:path*", "/pricing/:path*", "/api/:path*", "/auth/:path*"],
};
