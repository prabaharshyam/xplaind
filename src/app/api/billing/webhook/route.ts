// PAY-3: Cashfree tells us about a payment. The signature proves the message came from Cashfree,
// but we still ask Cashfree for the order before granting anything, so a replayed or forged
// message cannot unlock Pro. Granting is idempotent, so retries and the return page are safe.
import { json } from "@/lib/account/http";
import { paymentsConfig } from "@/lib/billing/config";
import { confirmOrder } from "@/lib/billing/confirm";
import { webhookIsGenuine } from "@/lib/billing/signature";
import { serviceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const config = paymentsConfig();
  const admin = serviceClient();
  if (!config || !admin) return json({ ok: false }, 503);

  const raw = await request.text();
  if (raw.length > 50_000) return json({ ok: false }, 413);
  const genuine = webhookIsGenuine(raw, request.headers.get("x-webhook-timestamp"), request.headers.get("x-webhook-signature"), config.secret, Date.now());
  if (!genuine) return json({ ok: false }, 401);

  let orderId: unknown;
  try {
    orderId = (JSON.parse(raw) as { data?: { order?: { order_id?: unknown } } }).data?.order?.order_id;
  } catch {
    return json({ ok: false }, 400);
  }
  if (typeof orderId !== "string" || !/^xp_[A-Za-z0-9_-]{6,42}$/.test(orderId)) return json({ ok: true, ignored: true });

  const result = await confirmOrder(admin, config, orderId);
  // Cashfree retries anything that is not 2xx; "pending" asks it to try again later.
  return json({ ok: true, result }, result === "pending" ? 503 : 200);
}
