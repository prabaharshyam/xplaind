// VI-11: a small signed envelope, so the server can hand the browser data it wrote (an interview plan
// made from a job description) and trust it when it comes back, without storing it. Node only.
import { createHmac, timingSafeEqual } from "node:crypto";

const b64url = (b: Buffer) => b.toString("base64url");

/** Signs any JSON value with an expiry. */
export function seal(value: unknown, secret: string, ttlMs: number, now = Date.now()): string {
  const payload = b64url(Buffer.from(JSON.stringify({ v: value, e: now + ttlMs })));
  const sig = b64url(createHmac("sha256", `seal:${secret}`).update(payload).digest());
  return `${payload}.${sig}`;
}

/** The value a token carries, or null if we did not sign it or it has expired. */
export function unseal(token: string, secret: string, now = Date.now()): unknown {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", `seal:${secret}`).update(payload).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const { v, e } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { v?: unknown; e?: unknown };
    return typeof e === "number" && e > now ? (v ?? null) : null;
  } catch {
    return null;
  }
}
