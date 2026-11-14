"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { primaryButton, secondaryButton } from "@/components/ui";
import { PLANS, type PlanId, rupees } from "@/lib/billing/plans";

type CashfreeCheckout = { checkout: (o: { paymentSessionId: string; redirectTarget: "_self" }) => Promise<unknown> };
type RazorpaySuccess = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayFailure = { error?: { description?: string; reason?: string } };
type RazorpayInstance = { open: () => void; on: (event: "payment.failed", cb: (r: RazorpayFailure) => void) => void };
type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: { email?: string };
  theme?: { color: string };
  handler: (r: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void; escape?: boolean };
};
declare global {
  interface Window {
    Cashfree?: (o: { mode: "sandbox" | "production" }) => CashfreeCheckout;
    Razorpay?: new (o: RazorpayOptions) => RazorpayInstance;
  }
}

const SDK = { cashfree: "https://sdk.cashfree.com/js/v3/cashfree.js", razorpay: "https://checkout.razorpay.com/v1/checkout.js" } as const;
export type Provider = keyof typeof SDK;

/** Loads the gateway's checkout script only when a learner presses Pay, never on page load. */
function loadSdk(provider: Provider): Promise<void> {
  if (provider === "cashfree" ? window.Cashfree : window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SDK[provider];
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("sdk"));
    document.head.appendChild(s);
  });
}

type RazorpayOrder = { order_id: string; amount: number; currency: string; key_id: string; receipt: string; email: string | null; description: string; error?: string };

const field =
  "min-h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700";

/**
 * PAY-3: asks for the two things Cashfree needs (a mobile number and consent), then opens Cashfree's checkout.
 * RZ-1: with Razorpay, asks only for consent (Razorpay's own window asks for the phone), opens the
 * Standard Checkout window, and hands its result to our server to verify before showing success.
 */
type Promo = { code: string; percentOff: number; amount: number };

/** PAY-9: promo codes work on the 30-day pass, through Razorpay. */
const takesPromo = (planId: PlanId, provider: Provider) => provider === "razorpay" && planId === "pass_month";

export function BuyPass({ planId, label, price, popular, provider = "cashfree" }: { planId: PlanId; label: string; price: string; popular?: boolean; provider?: Provider }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const titleId = useId();
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [promo, setPromo] = useState<Promo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const promoId = useId();
  const showPromo = takesPromo(planId, provider);
  // RF-1: a friend's link takes 10% off a first pass; a promo code replaces it rather than adding to it.
  const [friendOff, setFriendOff] = useState(0);
  const friendPrice = friendOff ? rupees(Math.round((PLANS[planId].paise * (100 - friendOff)) / 100)) : null;
  const toPay = promo ? (promo.amount === 0 ? "Free" : rupees(promo.amount)) : (friendPrice ?? price);
  const checkOffer = () => {
    if (provider !== "razorpay") return;
    void fetch("/api/billing/offer")
      .then((r) => (r.ok ? (r.json() as Promise<{ percent: number }>) : { percent: 0 }))
      .then((o) => setFriendOff(o.percent || 0))
      .catch(() => undefined);
  };

  const applyPromo = async () => {
    const c = code.trim();
    if (!c || checking) return;
    setChecking(true);
    setPromoError(null);
    const res = await fetch("/api/billing/promo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId, code: c }) }).catch(() => null);
    setChecking(false);
    if (res?.status === 401) {
      dialog.current?.close();
      router.push("/signin?next=/pricing");
      return;
    }
    const body = (await res?.json().catch(() => null)) as (Promo & { error?: string }) | null;
    if (!res?.ok || !body?.code) {
      setPromo(null);
      return setPromoError(body?.error ?? "Could not check the code. Please try again.");
    }
    setPromo({ code: body.code, percentOff: body.percentOff, amount: body.amount });
  };

  // A modal <dialog> left open makes the whole page inert. The router keeps this page mounted but
  // hidden after navigating away, so close the dialog whenever this component is hidden or removed.
  useEffect(() => {
    const d = dialog.current;
    return () => d?.close();
  }, []);

  const reopen = () => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  };

  const payRazorpay = async () => {
    const res = await fetch("/api/billing/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId, agree, ...(promo ? { promo: promo.code } : {}) }) });
    if (res.status === 401) {
      dialog.current?.close();
      router.push("/signin?next=/pricing");
      return;
    }
    const order = (await res.json().catch(() => null)) as (RazorpayOrder & { free?: boolean }) | null;
    // PAY-9: a 100% code needs no payment; the server has already started the pass.
    if (res.ok && order?.free) {
      dialog.current?.close();
      return router.push(`/pricing/return?order_id=${encodeURIComponent(order.receipt)}`);
    }
    if (!res.ok || !order?.order_id || !order.key_id) throw new Error(order?.error ?? "Could not start the payment. Please try again.");
    await loadSdk("razorpay");
    const checkout = new window.Razorpay!({
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      order_id: order.order_id,
      name: "Xplaind",
      description: order.description,
      prefill: order.email ? { email: order.email } : undefined,
      theme: { color: "#6d28d9" },
      handler: (r) => {
        setError(null);
        void (async () => {
          const v = await fetch("/api/billing/verify-payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r) }).catch(() => null);
          const body = (await v?.json().catch(() => null)) as { order?: string; error?: string } | null;
          // Verified or still being confirmed: the return page shows the outcome from our records.
          if (v && (v.ok || v.status === 202)) return router.push(`/pricing/return?order_id=${encodeURIComponent(body?.order ?? order.receipt)}`);
          setError(body?.error ?? "We could not confirm the payment. If money left your account, contact us with this order number: " + order.receipt);
          setBusy(false);
          reopen();
        })();
      },
      modal: {
        // Closing Razorpay's window: keep the last failure's reason if there was one.
        ondismiss: () => {
          setError(failure ?? "The payment window was closed, so nothing was charged. You can try again.");
          setBusy(false);
          reopen();
        },
      },
    });
    // Razorpay keeps its window open after a failed attempt so the learner can retry there.
    let failure: string | null = null;
    checkout.on("payment.failed", (r) => {
      failure = r.error?.description ? `The payment failed: ${r.error.description}` : "The payment failed. Please try again or use another method.";
    });
    // Our dialog sits in the browser's top layer, above Razorpay's window, so it steps aside while
    // Razorpay is open and comes back with the message if the payment is cancelled or fails.
    dialog.current?.close();
    checkout.open();
  };

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (provider === "razorpay") return await payRazorpay();
      const res = await fetch("/api/billing/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId, phone, agree }) });
      if (res.status === 401) {
        dialog.current?.close();
        router.push("/signin?next=/pricing");
        return;
      }
      const data = (await res.json().catch(() => null)) as { paymentSessionId?: string; mode?: "sandbox" | "production"; error?: string } | null;
      if (!res.ok || !data?.paymentSessionId || !data.mode) throw new Error(data?.error ?? "Could not start the payment. Please try again.");
      await loadSdk("cashfree");
      await window.Cashfree!({ mode: data.mode }).checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: "_self" });
    } catch (err) {
      setError(err instanceof Error && err.message !== "sdk" ? err.message : "The payment page did not load. Check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className={`${popular ? primaryButton : secondaryButton} w-full justify-center`} onClick={() => {
          dialog.current?.showModal();
          checkOffer();
        }}>
        Buy for {price}
        <span className="sr-only">: {label}</span>
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClick={(e) => {
          if (e.target === dialog.current && !busy) dialog.current?.close();
        }}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] max-w-none rounded-2xl bg-white p-0 text-zinc-900 backdrop:bg-black/60 dark:bg-zinc-900 dark:text-white"
      >
        <form onSubmit={pay} className="flex flex-col gap-4 p-6">
          <h2 id={titleId} className="text-xl font-semibold">
            {label}, {price}
          </h2>
          <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">One payment by UPI, card or net banking. It does not renew by itself.</p>
          {friendPrice && !promo && (
            <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
              A friend invited you: {friendOff}% off your first pass. You pay {friendPrice} instead of <s>{price}</s>.
            </p>
          )}
          {showPromo && (
            <div className="flex flex-col gap-1">
              <label htmlFor={promoId} className="text-sm font-medium">
                Promo code <span className="font-normal text-zinc-600 dark:text-zinc-400">(if you have one)</span>
              </label>
              <div className="flex gap-2">
                <input
                  id={promoId}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 32));
                    setPromo(null);
                    setPromoError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void applyPromo();
                    }
                  }}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={32}
                  aria-describedby={`${promoId}-msg`}
                  className={`${field} min-w-0 flex-1 uppercase`}
                />
                <button type="button" disabled={checking || code.trim().length < 3 || busy} className={`${secondaryButton} disabled:opacity-50`} onClick={() => void applyPromo()}>
                  {checking ? "Checking…" : "Apply"}
                </button>
              </div>
              <p id={`${promoId}-msg`} aria-live="polite" className="min-h-5 text-sm">
                {promo ? (
                  <span className="text-teal-800 dark:text-teal-300">
                    {promo.code.toUpperCase()} applied: {promo.percentOff}% off. You pay {promo.amount === 0 ? "nothing" : rupees(promo.amount)} instead of <s>{price}</s>.
                  </span>
                ) : promoError ? (
                  <span className="text-rose-800 dark:text-rose-300">{promoError}</span>
                ) : null}
              </p>
            </div>
          )}
          {provider === "cashfree" && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Mobile number</span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">The payment company needs it. We do not keep it.</span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              required
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className={field}
            />
          </label>
          )}
          <label className="flex items-start gap-3 text-sm leading-6">
            <input type="checkbox" required checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 size-5 accent-violet-700" />
            <span>
              I am 18 or older and I agree to the{" "}
              <Link href="/terms" className="text-violet-800 underline underline-offset-2 dark:text-violet-300">
                terms
              </Link>{" "}
              and the{" "}
              <Link href="/refunds" className="text-violet-800 underline underline-offset-2 dark:text-violet-300">
                refund policy
              </Link>
              .
            </span>
          </label>
          {error && (
            <p role="alert" className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950 dark:text-rose-100">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy} className={`${primaryButton} disabled:opacity-60`}>
              {busy ? (promo?.amount === 0 ? "Starting your pass…" : "Opening the payment page…") : promo?.amount === 0 ? "Start my free pass" : `Pay ${toPay}`}
            </button>
            <button type="button" disabled={busy} className={secondaryButton} onClick={() => dialog.current?.close()}>
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
