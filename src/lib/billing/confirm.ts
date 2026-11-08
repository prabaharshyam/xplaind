// PAY-3: confirms an order with Cashfree and grants the pass. Shared by the page the learner
// returns to and the webhook, so whichever arrives first grants it and the other finds it done.
// Node only. The amount must match the plan's price exactly, so a changed order grants nothing.
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchOrder, paidPaymentId } from "./cashfree";
import type { PaymentsConfig } from "./config";
import { PLANS, isPlanId } from "./plans";

export type Confirmed = "granted" | "already" | "pending" | "failed" | "unknown";

export async function confirmOrder(admin: SupabaseClient, c: PaymentsConfig, orderId: string, now = new Date()): Promise<Confirmed> {
  const { data: row } = await admin.from("payments").select("plan_id, amount_paise, status, environment").eq("order_id", orderId).maybeSingle();
  if (!row || !isPlanId(row.plan_id) || row.environment !== c.mode) return "unknown";
  if (row.status === "paid") return "already";

  const order = await fetchOrder(c, orderId);
  if (!order) return "pending";
  if (order.status === "EXPIRED" || order.status === "TERMINATED") {
    await admin.from("payments").update({ status: "failed" }).eq("order_id", orderId).eq("status", "created");
    return "failed";
  }
  if (order.status !== "PAID") return "pending";
  const paise = Math.round(order.rupees * 100);
  if (order.currency !== "INR" || paise !== row.amount_paise || paise !== PLANS[row.plan_id].paise) return "unknown";

  const paymentId = await paidPaymentId(c, orderId);
  const { data, error } = await admin.rpc("grant_pass", { p_order: orderId, p_cf_payment: paymentId, p_now: now.toISOString() });
  if (error) return "pending";
  return data === "granted" ? "granted" : data === "already" ? "already" : "unknown";
}
