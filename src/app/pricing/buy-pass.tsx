"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { primaryButton, secondaryButton } from "@/components/ui";
import type { PlanId } from "@/lib/billing/plans";

type CashfreeCheckout = { checkout: (o: { paymentSessionId: string; redirectTarget: "_self" }) => Promise<unknown> };
declare global {
  interface Window {
    Cashfree?: (o: { mode: "sandbox" | "production" }) => CashfreeCheckout;
  }
}

const SDK = "https://sdk.cashfree.com/js/v3/cashfree.js";

/** Loads Cashfree's checkout script only when a learner presses Pay, never on page load. */
function loadSdk(): Promise<void> {
  if (window.Cashfree) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SDK;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("sdk"));
    document.head.appendChild(s);
  });
}

const field =
  "min-h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700";

/** PAY-3: asks for the two things Cashfree needs (a mobile number and consent), then opens Cashfree's checkout. */
export function BuyPass({ planId, label, price, popular }: { planId: PlanId; label: string; price: string; popular?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const titleId = useId();
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/billing/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId, phone, agree }) });
      if (res.status === 401) {
        dialog.current?.close();
        router.push("/signin?next=/pricing");
        return;
      }
      const data = (await res.json().catch(() => null)) as { paymentSessionId?: string; mode?: "sandbox" | "production"; error?: string } | null;
      if (!res.ok || !data?.paymentSessionId || !data.mode) throw new Error(data?.error ?? "Could not start the payment. Please try again.");
      await loadSdk();
      await window.Cashfree!({ mode: data.mode }).checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: "_self" });
    } catch (err) {
      setError(err instanceof Error && err.message !== "sdk" ? err.message : "The payment page did not load. Check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className={`${popular ? primaryButton : secondaryButton} w-full justify-center`} onClick={() => dialog.current?.showModal()}>
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
              {busy ? "Opening the payment page…" : `Pay ${price}`}
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
