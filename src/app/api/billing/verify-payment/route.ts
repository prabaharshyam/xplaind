// RZ-1: the browser hands back what Razorpay's checkout returned after a payment. The signature
// proves the three ids belong together; we then ask Razorpay for the order and payment before
// granting, so nothing the browser says alone can unlock Pro. Granting is idempotent (grant_pass).
import { z } from "zod";
import { json, problem, readJson } from "@/lib/account/http";
import { razorpayConfig } from "@/lib/billing/config";
import { checkoutIsGenuine, confirmRazorpay } from "@/lib/billing/razorpay";
import { serviceClient } from "@/lib/supabase/server";

const Body = z.object({
  razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]{6,40}$/),
  razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]{6,40}$/),
  razorpay_signature: z.string().max(200),
});

export async function POST(request: Request) {
  const config = razorpayConfig();
  const admin = serviceClient();
  if (!config || !admin) return problem(503, "Pro passes are not on sale yet.");
  const parsed = Body.safeParse(await readJson(request, 2_000).catch(() => null));
  if (!parsed.success) return problem(400, "The payment details are missing or incomplete.");
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = parsed.data;

  if (!checkoutIsGenuine(orderId, paymentId, signature, config.secret)) return problem(400, "We could not verify this payment. If money left your account, contact us.");

  const { result, orderId: ours } = await confirmRazorpay(admin, config, orderId, paymentId);
  if (result === "granted" || result === "already") return json({ ok: true, result, order: ours });
  if (result === "pending") return json({ ok: false, result, order: ours }, 202);
  return problem(400, result === "failed" ? "The payment did not go through." : "We could not match this payment to an order.");
}
