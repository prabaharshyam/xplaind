import { BUSINESS } from "@/lib/business";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { PLANS, isPlanId, rupees } from "@/lib/billing/plans";
import { currentUser, userClient } from "@/lib/supabase/server";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Payment receipt", robots: { index: false } };

const istDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

async function Receipt({ params }: { params: PageProps<"/settings/billing/receipt/[order]">["params"] }) {
  const { order } = await params;
  const client = await userClient();
  const user = client ? await currentUser(client) : null;
  if (!user) redirect(`/signin?next=/settings/billing/receipt/${encodeURIComponent(order)}`);
  const { data: p } = await client!.from("payments").select("order_id, plan_id, amount_paise, status, environment, paid_at, cf_payment_id").eq("order_id", order).maybeSingle();
  if (!p || p.status !== "paid" || !p.paid_at || !isPlanId(p.plan_id)) notFound();
  const rows: [string, string][] = [
    ["Order number", p.order_id],
    ["Payment reference", p.cf_payment_id ?? "—"],
    ["Date", istDate(p.paid_at)],
    ["Item", `Xplaind Pro, ${PLANS[p.plan_id].name}`],
    ["Amount paid", rupees(p.amount_paise)],
    ["Paid by", user.email ?? "—"],
  ];
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Payment receipt{p.environment === "sandbox" ? " (test payment)" : ""}</h1>
      <p className="mt-2 text-zinc-700 dark:text-zinc-300">
        Xplaind (xplaind.in), a brand of {BUSINESS.legalName}, GSTIN {BUSINESS.gstin}. Paid through Cashfree. Price includes GST.
      </p>
      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-zinc-600 dark:text-zinc-400">{k}</dt>
            <dd className="font-medium break-all">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">This is a payment receipt, not a tax invoice.</p>
    </>
  );
}

/** PAY-6: a receipt the learner can print or save as a PDF. */
export default function ReceiptPage({ params }: PageProps<"/settings/billing/receipt/[order]">) {
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <Suspense fallback={<p>Loading your receipt…</p>}>
        <Receipt params={params} />
      </Suspense>
      <PrintButton />
    </main>
  );
}
