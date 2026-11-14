import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { InviteFriends } from "@/components/billing/invite-friends";
import { Skeleton } from "@/components/skeleton";
import { primaryButton } from "@/components/ui";
import { proOpen } from "@/lib/billing/config";
import { PLANS, isPlanId, passIsActive, rupees } from "@/lib/billing/plans";

/** The time of this request; kept out of the component so rendering stays pure. */
const nowMs = () => Date.now();
import { accountsEnabled } from "@/lib/supabase/config";
import { currentUser, userClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Billing", robots: { index: false } };

const istDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

const STATUS: Record<string, string> = { paid: "Paid", created: "Not completed", failed: "Failed" };

async function Billing() {
  const client = await userClient();
  const user = client ? await currentUser(client) : null;
  if (!user) redirect("/signin?next=/settings/billing");
  // Read under the learner's own session, so row-level security returns only their rows.
  const [{ data: pass }, { data: payments }] = await Promise.all([
    client!.from("entitlements").select("plan_id, valid_until").maybeSingle(),
    client!.from("payments").select("order_id, plan_id, amount_paise, status, environment, created_at, paid_at").order("created_at", { ascending: false }).limit(50),
  ]);
  const active = pass && passIsActive(pass.valid_until, nowMs());
  return (
    <>
      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Your plan</h2>
        {active && isPlanId(pass.plan_id) ? (
          <p className="mt-2 leading-7">
            <strong>Pro</strong> ({PLANS[pass.plan_id].name}), valid until {istDate(pass.valid_until)}. It does not renew by itself.
          </p>
        ) : (
          <p className="mt-2 leading-7">Standard plan. {pass ? `Your last pass ended on ${istDate(pass.valid_until)}.` : ""}</p>
        )}
        {proOpen() && (
          <Link href="/pricing" className={`${primaryButton} mt-4`}>
            {active ? "Add more time" : "See Pro passes"}
          </Link>
        )}
      </section>
      {proOpen() && <InviteFriends />}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">Payments</h2>
        {payments && payments.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-3">
            {payments.map((p) => (
              <li key={p.order_id} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="font-medium">
                  {isPlanId(p.plan_id) ? PLANS[p.plan_id].name : p.plan_id}, {rupees(p.amount_paise)}
                  {p.environment === "sandbox" ? " (test)" : ""}
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {STATUS[p.status] ?? p.status} · {istDate(p.paid_at ?? p.created_at)} · Order {p.order_id}
                </p>
                {p.status === "paid" && (
                  <Link href={`/settings/billing/receipt/${p.order_id}`} className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300">
                    View receipt<span className="sr-only"> for order {p.order_id}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-zinc-700 dark:text-zinc-300">No payments yet.</p>
        )}
      </section>
      <p className="mt-6 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Passes are one-time payments, so there is nothing to cancel. For a refund within 7 days of buying, see the{" "}
        <Link href="/refunds" className="text-violet-800 underline underline-offset-2 dark:text-violet-300">
          refund policy
        </Link>
        .
      </p>
    </>
  );
}

/** PAY-6: the learner's plan, when it ends, and every payment with a receipt. */
export default function BillingPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
      {accountsEnabled() ? (
        <Suspense fallback={<Skeleton label="Loading your billing…" className="mt-6" />}>
          <Billing />
        </Suspense>
      ) : (
        <p className="mt-4 leading-7">Sign-ups are paused for a short while, so there is nothing to bill. Everything on the site works without an account.</p>
      )}
    </main>
  );
}
