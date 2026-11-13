import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { BUSINESS } from "@/lib/business";
import { providerName } from "@/lib/billing/config";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Refunds and cancellations",
  description: "How refunds work for Xplaind Pro passes: one-time payments, no auto-renewal, and a full refund within 7 days of buying.",
  path: "/refunds",
});

const UPDATED = "13 November 2026";
const contact: string = BUSINESS.email;
const H2 = "mt-10 text-2xl font-semibold tracking-tight";
const P = "mt-3 leading-7 text-zinc-800 dark:text-zinc-200";
const A = "font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300";

/** PAY-6: the refund and cancellation policy for Pro passes, in plain English. */
export default function RefundsPage() {
  return (
    <main>
      <PageHero theme="governance" shape="icon:scale" icon="scale" eyebrow="Refunds" title="Refunds and cancellations" lead="Pro passes are one-time payments with no auto-renewal. If a pass is not right for you, ask for your money back within 7 days.">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">Last updated {UPDATED}.</p>
      </PageHero>
      <div className="mx-auto max-w-3xl px-4 pt-4 pb-16 md:px-6">
        <h2 className={H2}>What you buy</h2>
        <p className={P}>
          A Pro pass is a one-time payment for 30 days, 6 months or 12 months of higher daily AI limits on Xplaind. Lessons, roadmaps, videos, practice and project guides do not need a pass. Prices are on the{" "}
          <Link href="/pricing" className={A}>
            pricing page
          </Link>
          .
        </p>

        <h2 className={H2}>Delivery</h2>
        <p className={P}>
          A Pro pass is a digital service. It starts on your Xplaind account as soon as the payment is confirmed, usually within a minute, and you can
          see it in{" "}
          <Link href="/settings/billing" className={A}>
            Settings, Billing
          </Link>
          . Nothing is shipped. If your pass has not started within an hour of paying, contact us and we fix it or refund you.
        </p>

        <h2 className={H2}>Cancelling</h2>
        <p className={P}>There is nothing to cancel. A pass does not renew and we never charge you again by ourselves. When it ends, your account goes back to the standard daily limits.</p>

        <h2 className={H2}>Refunds</h2>
        <ul className={`${P} list-disc pl-6`}>
          <li>Ask within 7 days of buying and we refund the full amount, whatever the reason. Your pass ends when the refund is made.</li>
          <li>After 7 days we do not refund the unused part of a pass.</li>
          <li>If you were charged but your pass did not start, or you were charged twice, we refund the extra payment in full, at any time.</li>
          <li>Refunds go back to the way you paid, through {providerName()}, within 5 to 7 working days of our approval. Your bank may take a few more days to show it.</li>
        </ul>

        <h2 className={H2}>How to ask</h2>
        <p className={P}>
          Write to us{" "}
          {contact ? (
            <>
              at{" "}
              <a href={`mailto:${contact}`} className={A}>
                {contact}
              </a>
            </>
          ) : (
            "by replying to any email we sent you"
          )}{" "}
          from the email address on your account, with the order number shown in{" "}
          <Link href="/settings/billing" className={A}>
            Settings, Billing
          </Link>
          , or call us on{" "}
          <a href={BUSINESS.phoneHref} className={A}>
            {BUSINESS.phone}
          </a>{" "}
          ({BUSINESS.hours}). We reply within 2 working days. All contact details are on our{" "}
          <Link href="/contact" className={A}>
            contact page
          </Link>
          .
        </p>
        <p className={`${P} text-sm text-zinc-600 dark:text-zinc-400`}>
          Xplaind is a brand of {BUSINESS.legalName} (GSTIN {BUSINESS.gstin}).
        </p>
      </div>
    </main>
  );
}
