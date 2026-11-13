import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { primaryButton, secondaryButton } from "@/components/ui";
import { paymentsConfig, providerName, razorpayConfig } from "@/lib/billing/config";
import { type Confirmed, confirmOrder } from "@/lib/billing/confirm";
import { serviceClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your payment", robots: { index: false } };

const text = (): Record<Confirmed, [string, string]> => ({
  granted: ["Pro is on", "Thank you. Your pass is active now, and your higher daily AI limits apply straight away. Your receipt is in Settings, under Billing."],
  already: ["Pro is on", "This payment is confirmed and your pass is active. Your receipt is in Settings, under Billing."],
  pending: ["Confirming your payment", `${providerName()} has not confirmed this payment yet. It usually takes a few seconds; reload this page in a moment. If money left your account and the pass does not start within an hour, contact us with the order number below.`],
  failed: ["The payment did not go through", "This order was not paid, so your pass has not started. If your bank shows a debit, it is normally reversed within 5 to 7 working days. You can try again from the pricing page."],
  unknown: ["We could not find that payment", "Check the link, or see your payments in Settings, under Billing. If you paid and the pass has not started, contact us with the order number below."],
});

/**
 * PAY-3: where Cashfree sends the learner after paying. We confirm with Cashfree before showing success.
 * RZ-1: with Razorpay, the checkout's verify call has already confirmed with Razorpay, so this page
 * reads our own record of the order.
 */
export default function PaymentReturnPage({ searchParams }: PageProps<"/pricing/return">) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <Suspense fallback={<p className="text-lg">Checking your payment…</p>}>
        <Result searchParams={searchParams} />
      </Suspense>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/settings/billing" className={primaryButton}>
          See billing
        </Link>
        <Link href="/ai/tutor" className={secondaryButton}>
          Ask the AI tutor
        </Link>
      </div>
    </main>
  );
}

async function Result({ searchParams }: { searchParams: PageProps<"/pricing/return">["searchParams"] }) {
  const raw = (await searchParams).order_id;
  const orderId = typeof raw === "string" && /^xp_[A-Za-z0-9_-]{6,42}$/.test(raw) ? raw : null;
  const config = paymentsConfig();
  const admin = serviceClient();
  const result: Confirmed = !orderId || !admin ? "unknown" : config ? await confirmOrder(admin, config, orderId) : razorpayConfig() ? await recorded(admin, orderId) : "unknown";
  const [title, body] = text()[result];
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-lg leading-8 text-zinc-700 dark:text-zinc-300">{body}</p>
      {orderId && <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Order number: {orderId}</p>}
    </>
  );
}

/** RZ-1: the state of an order as our records hold it. */
async function recorded(admin: NonNullable<ReturnType<typeof serviceClient>>, orderId: string): Promise<Confirmed> {
  const { data } = await admin.from("payments").select("status").eq("order_id", orderId).maybeSingle();
  return !data ? "unknown" : data.status === "paid" ? "already" : data.status === "failed" ? "failed" : "pending";
}
