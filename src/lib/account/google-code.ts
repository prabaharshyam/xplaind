// AC-1c (owner report, 2026-11-18: Google's screen said "continue to ...supabase.co" again): Google
// sign-in without Supabase's own redirect, for when Google's button cannot be used (it has not loaded
// yet, it is blocked, or JavaScript is off). The visitor goes straight to Google and back to
// xplaind.in/auth/google with a code; our server swaps the code for an ID token with the client secret
// and hands that to Supabase, as the button does. So Google shows "continue to xplaind.in" on every
// path. Pure, for tests: the network call lives in the route.

/** Short-lived cookie with the state, the raw nonce and the page to return to. */
export const GOOGLE_CODE_COOKIE = "xp_gcode";
export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export type GoogleCodeConfig = { clientId: string; clientSecret: string; redirectUri: string };

/**
 * The code flow's settings, or null when it cannot be used here: no client id or secret, or this is
 * not the site's own address (previews), since Google only returns to addresses listed for the app.
 */
export function googleCodeConfig(env: Record<string, string | undefined>, origin: string, site: string): GoogleCodeConfig | null {
  const clientId = env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret || origin !== new URL(site).origin) return null;
  return { clientId, clientSecret, redirectUri: `${origin}/auth/google` };
}

/** Where to send the visitor: Google's own sign-in, asking which account to use. */
export function googleAuthUrl(c: GoogleCodeConfig, state: string, hashedNonce: string): string {
  const q = new URLSearchParams({
    client_id: c.clientId,
    redirect_uri: c.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce: hashedNonce,
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${q}`;
}

export const encodeCodeCookie = (state: string, nonce: string, next: string) => `${state}.${nonce}.${encodeURIComponent(next.slice(0, 200))}`;

/** The cookie read back, only if its state matches the one Google returned. */
export function readCodeCookie(cookie: string | undefined, state: string | null): { nonce: string; next: string | null } | null {
  const [saved, nonce, rawNext] = (cookie ?? "").split(".", 3);
  if (!saved || !nonce || !state || saved !== state) return null;
  let next: string | null = null;
  try {
    next = rawNext ? decodeURIComponent(rawNext) : null;
  } catch {
    next = null;
  }
  return { nonce, next };
}
