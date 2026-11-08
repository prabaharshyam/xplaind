// Keeps Supabase sessions fresh on account pages and APIs (Server Components
// cannot write cookies). Static content pages are not matched, so they stay static.
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { publicSupabase } from "@/lib/signups";

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
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/dashboard", "/settings/:path*", "/pricing/:path*", "/api/:path*", "/auth/:path*"],
};
