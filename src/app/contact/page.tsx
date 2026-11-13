import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { BUSINESS } from "@/lib/business";
import { pageMeta } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Contact Xplaind",
  description: "Contact Xplaind, a brand of ZEREH Venture: email and phone for questions, payments, refunds and account help.",
  path: "/contact",
});

const A = "font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300";

/** BIZ-1: how to reach the people behind Xplaind, and the business that runs it. */
export default function ContactPage() {
  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          url: `${siteUrl()}/contact`,
          mainEntity: {
            "@type": "Organization",
            name: BUSINESS.brand,
            legalName: BUSINESS.legalName,
            url: siteUrl(),
            email: BUSINESS.email,
            telephone: BUSINESS.phone,
            taxID: BUSINESS.gstin,
          },
        }}
      />
      <PageHero
        theme="career"
        shape="icon:chat"
        icon="chat"
        eyebrow="Contact"
        title="Talk to us"
        lead="Questions about lessons, your account, a Pro pass, a payment or a refund? Write or call, and a person replies."
      />
      <div className="mx-auto max-w-3xl px-4 pt-4 pb-16 md:px-6">
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          <li className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="grid size-10 place-items-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" aria-hidden="true">
              <Icon name="chat" size={20} />
            </span>
            <h2 className="mt-3 text-lg font-semibold">Email</h2>
            <a href={`mailto:${BUSINESS.email}`} className={`${A} mt-1 inline-block break-all`}>
              {BUSINESS.email}
            </a>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">We reply within 2 working days.</p>
          </li>
          <li className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="grid size-10 place-items-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" aria-hidden="true">
              <Icon name="mic" size={20} />
            </span>
            <h2 className="mt-3 text-lg font-semibold">Phone</h2>
            <a href={BUSINESS.phoneHref} className={`${A} mt-1 inline-block`}>
              {BUSINESS.phone}
            </a>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{BUSINESS.hours}.</p>
          </li>
        </ul>

        <section aria-labelledby="help-h" className="mt-10">
          <h2 id="help-h" className="text-2xl font-semibold tracking-tight">
            Payments and refunds
          </h2>
          <p className="mt-3 leading-7 text-zinc-800 dark:text-zinc-200">
            For a payment, write from the email address on your account and include the order number from{" "}
            <Link href="/settings/billing" className={A}>
              Settings, Billing
            </Link>
            . Refunds follow our{" "}
            <Link href="/refunds" className={A}>
              refund and cancellation policy
            </Link>
            . Prices and what each pass includes are on the{" "}
            <Link href="/pricing" className={A}>
              pricing page
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="biz-h" className="mt-10 rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-900">
          <h2 id="biz-h" className="text-lg font-semibold">
            Who runs Xplaind
          </h2>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm leading-6 sm:grid-cols-[auto_1fr]">
            <dt className="font-medium">Brand</dt>
            <dd>{BUSINESS.brand} (xplaind.in)</dd>
            <dt className="font-medium">Business</dt>
            <dd>{BUSINESS.legalName}</dd>
            <dt className="font-medium">GSTIN</dt>
            <dd>{BUSINESS.gstin}</dd>
          </dl>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            See also our{" "}
            <Link href="/privacy" className={A}>
              privacy policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className={A}>
              terms
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
