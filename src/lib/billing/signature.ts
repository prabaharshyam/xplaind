// PAY-3: checks that a webhook really came from Cashfree. Cashfree signs the timestamp header
// followed by the raw request body with HMAC-SHA256 and the account's secret key, base64 encoded.
// Node only. The webhook never trusts the body: it asks Cashfree for the order before granting.
import { createHmac, timingSafeEqual } from "node:crypto";

export function signWebhook(rawBody: string, timestamp: string, secret: string): string {
  return createHmac("sha256", secret).update(timestamp + rawBody).digest("base64");
}

/** True when the signature matches and the timestamp is within five minutes of now. */
export function webhookIsGenuine(rawBody: string, timestamp: string | null, signature: string | null, secret: string, nowMs: number): boolean {
  if (!timestamp || !signature) return false;
  const sentMs = Number(timestamp) < 1e12 ? Number(timestamp) * 1000 : Number(timestamp);
  if (!Number.isFinite(sentMs) || Math.abs(nowMs - sentMs) > 5 * 60_000) return false;
  const want = Buffer.from(signWebhook(rawBody, timestamp, secret));
  const got = Buffer.from(signature);
  return want.length === got.length && timingSafeEqual(want, got);
}
