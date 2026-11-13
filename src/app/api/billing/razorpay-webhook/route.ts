// RZ-1: Razorpay tells us about a payment, so a pass still starts if the learner closes the tab
// before the checkout's verify call. Set the URL and RAZORPAY_WEBHOOK_SECRET in the Razorpay
// dashboard (events: payment.captured, order.paid). The signature proves the sender; we still ask
// Razorpay for the order before granting, and granting is idempotent.
import { json } from "@/lib/account/http";
import { razorpayConfig } from "@/lib/billing/config";
import { confirmRazorpay, webhookIsGenuine } from "@/lib/billing/razorpay";
import { serviceClient } from "@/lib/supabase/server";

type Event = { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } }; order?: { entity?: { id?: string } } } };

export async function POST(request: Request) {
  const config = razorpayConfig();
  const admin = serviceClient();
  if (!config?.webhookSecret || !admin) return json({ ok: false }, 503);

  const raw = await request.text();
  if (raw.length > 100_000) return json({ ok: false }, 413);
  if (!webhookIsGenuine(raw, request.headers.get("x-razorpay-signature"), config.webhookSecret)) return json({ ok: false }, 401);

  let body: Event;
  try {
    body = JSON.parse(raw) as Event;
  } catch {
    return json({ ok: false }, 400);
  }
  if (body.event !== "payment.captured" && body.event !== "order.paid") return json({ ok: true, ignored: true });
  const orderId = body.payload?.order?.entity?.id ?? body.payload?.payment?.entity?.order_id;
  const paymentId = body.payload?.payment?.entity?.id ?? null;
  if (typeof orderId !== "string" || !/^order_[A-Za-z0-9]{6,40}$/.test(orderId)) return json({ ok: true, ignored: true });

  const { result } = await confirmRazorpay(admin, config, orderId, typeof paymentId === "string" ? paymentId : null);
  // Razorpay retries anything that is not 2xx; "pending" asks it to try again later.
  return json({ ok: true, result }, result === "pending" ? 503 : 200);
}
