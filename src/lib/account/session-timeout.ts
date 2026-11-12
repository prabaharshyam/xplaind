// AC-13 (owner decision 2026-11-12): a signed-in learner is signed out after 7 days without a
// visit, and always 30 days after signing in, so a shared or cyber-café computer does not stay
// signed in forever. Pure: used by the browser (every page) and the proxy (account pages, APIs).

export const IDLE_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_MS = 30 * 24 * 60 * 60 * 1000;
/** Last visit, in milliseconds since 1970, kept in a first-party cookie (not a tracker: never sent anywhere else). */
export const SEEN_COOKIE = "xp_seen";

export type Expiry = "idle" | "max" | null;

/** Why the session should end now, or null to keep it. Unknown times never end a session. */
export function sessionExpiry({ now, signedInAt, lastSeen }: { now: number; signedInAt: number | null; lastSeen: number | null }): Expiry {
  if (signedInAt !== null && now - signedInAt > MAX_MS) return "max";
  if (lastSeen !== null && now - lastSeen > IDLE_MS) return "idle";
  return null;
}

/** A cookie or ISO value as milliseconds, or null when missing or not a sane time. */
export function toMs(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : /^\d+$/.test(value) ? Number(value) : Date.parse(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** When the learner signed in, from the access token's claims: the earliest `amr` timestamp (seconds). */
export function signedInAtFromClaims(claims: unknown): number | null {
  const amr = (claims as { amr?: unknown } | null)?.amr;
  if (!Array.isArray(amr)) return null;
  const times = amr.map((a) => (a as { timestamp?: unknown })?.timestamp).filter((t): t is number => typeof t === "number" && t > 0);
  return times.length ? Math.min(...times) * 1000 : null;
}

/** The cookie that records a visit: first-party, readable by the page, kept 30 days. */
export function seenCookie(now: number, secure: boolean): string {
  return `${SEEN_COOKIE}=${now}; Path=/; Max-Age=${MAX_MS / 1000}; SameSite=Lax${secure ? "; Secure" : ""}`;
}
