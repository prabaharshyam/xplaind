"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/art/icons";
import { primaryButton, secondaryButton } from "@/components/ui";
import { PLANS, type PlanId, perDay, rupees } from "@/lib/billing/plans";

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
  "min-h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700";

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
  // PAY-12: the promo field stays folded behind a small link until asked for, as in most checkouts.
  const [promoOpen, setPromoOpen] = useState(false);
  const showPromo = takesPromo(planId, provider);
  // RF-1: a friend's link takes 10% off a first pass; a promo code replaces it rather than adding to it.
  const [friendOff, setFriendOff] = useState(0);
  const friendPrice = friendOff ? rupees(Math.round((PLANS[planId].paise * (100 - friendOff)) / 100)) : null;
  const toPay = promo ? (promo.amount === 0 ? "Free" : rupees(promo.amount)) : (friendPrice ?? price);
  const plan = PLANS[planId];
  // PAY-12: the saving, shown as its own line in the summary.
  const savedPaise = promo ? plan.paise - promo.amount : friendOff ? plan.paise - Math.round((plan.paise * (100 - friendOff)) / 100) : 0;
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
      theme: { color: "#0e4a50" },
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
        className="xp-glass-direct mx-0 mt-auto mb-0 w-full max-w-none rounded-t-[2rem] rounded-b-none p-0 text-zinc-900 backdrop:bg-black/50 backdrop:backdrop-blur-sm sm:m-auto sm:w-[min(26rem,calc(100vw-2rem))] sm:rounded-[2rem] dark:text-white"
      >
        {/* PAY-12 (owner request, 2026-11-18): a calm checkout. One summary, one total, one action; the
            promo code folded away; the reasons it is safe to pay right under the button. A bottom sheet on
            phones, a centred card on larger screens. */}
        <form onSubmit={pay} className="flex flex-col gap-5 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-brand-800 dark:text-brand-300">Xplaind Pro</p>
              <h2 id={titleId} className="mt-0.5 text-xl font-semibold tracking-tight">
                {label}
              </h2>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => dialog.current?.close()}
              aria-label="Close"
              className="xp-glass-btn -mt-1 -mr-1 grid size-11 shrink-0 place-items-center rounded-full text-zinc-700 dark:text-zinc-200"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          <ul className="flex flex-col gap-2 text-sm leading-6">
            {[
              `${plan.days} days of Pro, from the moment you pay`,
              "AI mock interviews with Zarina",
              "AI tutor, reviews and resume match",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <Icon name="tick" size={18} className="mt-0.5 shrink-0 text-brand-700 dark:text-brand-300" />
                {t}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 border-t border-black/10 pt-4 text-sm dark:border-white/10">
            {savedPaise > 0 && (
              <>
                <p className="flex justify-between gap-4">
                  <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
                  <span className="tabular-nums">{price}</span>
                </p>
                <p className="flex justify-between gap-4 text-teal-800 dark:text-teal-300">
                  <span>{promo ? `Code ${promo.code.toUpperCase()} (${promo.percentOff}% off)` : `Friend's invite (${friendOff}% off)`}</span>
                  <span className="tabular-nums">−{rupees(savedPaise)}</span>
                </p>
              </>
            )}
            <p className="flex items-baseline justify-between gap-4">
              <span className="font-semibold">Total today</span>
              <span className="text-3xl font-semibold tracking-tight tabular-nums">{toPay === "Free" ? "₹0" : toPay}</span>
            </p>
            <p className="text-right text-sm text-zinc-600 dark:text-zinc-400">
              {savedPaise > 0 ? "GST included" : `${perDay(plan)} a day · GST included`}
            </p>
          </div>

          {showPromo &&
            (promoOpen || promo ? (
              <div className="-mt-1 flex flex-col gap-1">
                <label htmlFor={promoId} className="sr-only">
                  Promo code
                </label>
                <div className="flex gap-2">
                  <input
                    id={promoId}
                    value={code}
                    autoFocus={!promo}
                    placeholder="Promo code"
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
                    className="h-11 min-w-0 flex-1 rounded-full border border-black/15 bg-white/70 px-4 text-sm uppercase placeholder:normal-case placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:border-white/15 dark:bg-white/5"
                  />
                  <button
                    type="button"
                    disabled={checking || code.trim().length < 3 || busy}
                    className="h-11 shrink-0 rounded-full px-4 text-sm font-semibold text-brand-800 hover:bg-black/5 disabled:opacity-40 dark:text-brand-300 dark:hover:bg-white/10"
                    onClick={() => void applyPromo()}
                  >
                    {checking ? "Checking…" : promo ? "Applied" : "Apply"}
                  </button>
                </div>
                <p id={`${promoId}-msg`} aria-live="polite" className="min-h-5 px-1 text-sm">
                  {promoError ? <span className="text-rose-800 dark:text-rose-300">{promoError}</span> : null}
                </p>
              </div>
            ) : (
              <button type="button" onClick={() => setPromoOpen(true)} className="-mt-2 min-h-11 self-start text-sm font-medium text-brand-800 underline underline-offset-4 dark:text-brand-300">
                Have a promo code?
              </button>
            ))}

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

          {error && (
            <p role="alert" className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950 dark:text-rose-100">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              <input type="checkbox" required checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-brand-700" />
              <span>
                I am 18 or older and agree to the{" "}
                <Link href="/terms" className="text-brand-800 underline underline-offset-2 dark:text-brand-300">
                  terms
                </Link>{" "}
                and{" "}
                <Link href="/refunds" className="text-brand-800 underline underline-offset-2 dark:text-brand-300">
                  refund policy
                </Link>
                .
              </span>
            </label>
            <button type="submit" disabled={busy} className={`${primaryButton} w-full gap-2 text-base disabled:opacity-60`}>
              {!busy && <Icon name="lock" size={16} />}
              {busy ? (promo?.amount === 0 ? "Starting your pass…" : "Opening secure payment…") : promo?.amount === 0 ? "Start my free pass" : `Pay ${toPay}`}
            </button>
            <p className="text-center text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Full refund within 7 days · No auto-renewal
              <br />
              UPI, cards and net banking, secured by {provider === "razorpay" ? "Razorpay" : "Cashfree"}
            </p>
          </div>
        </form>
      </dialog>
    </>
  );
}
