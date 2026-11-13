import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { PageHero } from "@/components/page-hero";
import { AI_KINDS, type AiKind } from "@/lib/ai/limits";
import { activePayments, paymentProvider, proOpen, providerName } from "@/lib/billing/config";
import {
  KIND_LABEL,
  PLANS,
  PLAN_IDS,
  TIER_LIMITS,
  rupees,
} from "@/lib/billing/plans";
import { BUSINESS } from "@/lib/business";
import { pageMeta } from "@/lib/seo";
import { accountsEnabled } from "@/lib/supabase/config";
import { BuyPass } from "./buy-pass";

export const metadata: Metadata = pageMeta({
  title: "Pricing: Pro passes for more AI help, from ₹249",
  description:
    "Every Xplaind roadmap, lesson, video, practice card and project guide comes with your account. A Pro pass gives you more AI tutor, interview feedback and resume review each day, from ₹249.",
  path: "/pricing",
});

const ORDER: AiKind[] = [
  "tutor",
  "grade",
  "interview",
  "resume",
  "book",
  "notes",
];

const FREE = [
  "All 9 role roadmaps and every lesson",
  "Every video lesson and video course",
  "181 interview questions with answers, and practice cards",
  "All guided project guides",
  "The code playground, with no limit",
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Do I need Pro for the roadmaps and lessons?",
    a: "No. Every roadmap, lesson, video, practice card, interview answer and project guide comes with your account, with no daily limit. Pro only changes how much AI help you get.",
  },
  {
    q: "Why charge for AI help?",
    a: "Each AI answer costs us money to run. Every account can try each AI helper a few times for free; a pass covers the cost of regular use, so Xplaind stays independent, with no ads and no sponsored rankings.",
  },
  {
    q: "Does it renew by itself?",
    a: "No. A pass is one payment for 30 days, 6 months or 12 months. When it ends you go back to a free account, and you buy again only if you want to. Buying while a pass runs adds the time on at the end.",
  },
  {
    q: "How can I pay?",
    a: `By UPI (Google Pay, PhonePe, Paytm and others), debit or credit card, or net banking, through ${providerName()}. We never see or store your card or UPI details.`,
  },
  {
    q: "Can I get a refund?",
    a: "Yes, within 7 days of buying. The refund policy has the details.",
  },
  {
    q: "Can students under 18 buy a pass?",
    a: "No. Accounts and passes are for people aged 18 and over. Lessons, topics, practice and videos stay open without an account.",
  },
];

/** PAY-5: what is free, what Pro adds, and the three passes. */
export default function PricingPage() {
  const open = proOpen();
  const sandbox = activePayments()?.mode === "sandbox";
  const provider = paymentProvider();
  const guestSample = accountsEnabled();
  return (
    <main>
      <PageHero
        theme="career"
        shape="icon:star"
        icon="star"
        eyebrow="Pricing"
        title="Learn AI step by step. Get more AI help with Pro."
        lead="Every roadmap, lesson and course link on Xplaind comes with your account, for good. A Pro pass gives you much more AI tutoring, interview feedback and resume review each day."
      />
      <div className="mx-auto max-w-6xl px-4 pt-4 pb-16 md:px-6">
        {/* BIZ-1: what is sold, by whom, and how it is delivered, in one place for learners and the payment gateway. */}
        <section aria-labelledby="what-h" className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 leading-7 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 id="what-h" className="text-lg font-semibold">
            What you can buy
          </h2>
          <p className="mt-1 text-zinc-800 dark:text-zinc-200">
            Xplaind sells one thing: <strong className="font-semibold">Pro passes</strong>, a one-time payment for 30 days, 6 months or 12 months of
            higher daily limits on the AI helpers (AI tutor, interview feedback, mock interview reports, resume review and study from your notes).
            Lessons, roadmaps, videos, practice and project guides need no pass. All prices are in Indian rupees and include GST. A pass is a
            digital service that starts on your account as soon as the payment is confirmed; nothing is shipped, and nothing renews by itself.
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Sold by {BUSINESS.legalName} (GSTIN {BUSINESS.gstin}). Questions:{" "}
            <Link href="/contact" className="font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300">
              contact us
            </Link>
            . Refunds:{" "}
            <Link href="/refunds" className="font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300">
              refund and cancellation policy
            </Link>
            .
          </p>
          {!open && (
            <p role="status" className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              Online payment for passes opens shortly. Until then, everything on Xplaind, including the AI helpers, works with the standard daily
              limits.
            </p>
          )}
        </section>
        {open && sandbox && (
          <p
            role="status"
            className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 leading-7 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
          >
            Test mode: payments go to {providerName()}&apos;s test environment and no real money
            moves.
          </p>
        )}

        <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <li className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Standard</h2>
            <p className="mt-2 text-3xl font-semibold">₹0</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              For everyone, always
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-sm leading-6">
              {FREE.map((f) => (
                <li key={f} className="flex gap-2">
                  <Icon
                    name="tick"
                    size={16}
                    className="mt-1 shrink-0 text-violet-700 dark:text-violet-300"
                  />
                  {f}
                </li>
              ))}
              <li className="flex gap-2">
                <Icon
                  name="tick"
                  size={16}
                  className="mt-1 shrink-0 text-violet-700 dark:text-violet-300"
                />
                Try each AI helper for free (2 or 3 times)
              </li>
            </ul>
            <Link
              href="/paths"
              className="mt-auto pt-5 font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300"
            >
              Start learning
            </Link>
          </li>
          {PLAN_IDS.map((id) => {
            const p = PLANS[id];
            return (
              <li
                key={id}
                className={`relative flex flex-col rounded-2xl border bg-white p-5 dark:bg-zinc-900 ${p.popular ? "border-violet-700 ring-2 ring-violet-700 dark:border-violet-400 dark:ring-violet-400" : "border-zinc-200 dark:border-zinc-800"}`}
              >
                {p.popular && (
                  <p className="absolute -top-3 left-5 rounded-full bg-violet-700 px-3 py-0.5 text-xs font-semibold text-white">
                    Most popular
                  </p>
                )}
                <h2 className="text-lg font-semibold">{p.name}</h2>
                <p className="mt-2 text-3xl font-semibold">{rupees(p.paise)}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">One-time payment, GST included</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {p.note}
                </p>
                <ul className="mt-4 flex flex-col gap-2 text-sm leading-6">
                  <li className="flex gap-2">
                    <Icon
                      name="tick"
                      size={16}
                      className="mt-1 shrink-0 text-violet-700 dark:text-violet-300"
                    />
                    Everything in Standard
                  </li>
                  <li className="flex gap-2">
                    <Icon
                      name="tick"
                      size={16}
                      className="mt-1 shrink-0 text-violet-700 dark:text-violet-300"
                    />
                    {TIER_LIMITS.pro.tutor} AI tutor questions and{" "}
                    {TIER_LIMITS.pro.grade} answer reviews a day
                  </li>
                  <li className="flex gap-2">
                    <Icon
                      name="tick"
                      size={16}
                      className="mt-1 shrink-0 text-violet-700 dark:text-violet-300"
                    />
                    {TIER_LIMITS.pro.interview} mock interview reports and{" "}
                    {TIER_LIMITS.pro.resume} resume reviews a day
                  </li>
                  <li className="flex gap-2">
                    <Icon
                      name="tick"
                      size={16}
                      className="mt-1 shrink-0 text-violet-700 dark:text-violet-300"
                    />
                    One payment, no auto-renewal
                  </li>
                </ul>
                <div className="mt-auto pt-5">
                  {open ? (
                    <BuyPass
                      provider={provider}
                      planId={id}
                      label={p.name}
                      price={rupees(p.paise)}
                      popular={p.popular}
                    />
                  ) : (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Online payment opens shortly
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <section aria-labelledby="limits" className="mt-14">
          <h2 id="limits" className="text-2xl font-semibold">
            AI helpers: free trial and Pro
          </h2>
          <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">
            A free account can try each AI helper a few times, once. Pro gives a
            daily allowance that resets at midnight India time. The limits keep
            costs fair for everyone, Pro included.
          </p>
          <div
            role="region"
            aria-label="AI helper limits table"
            tabIndex={0}
            className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 dark:border-zinc-800"
          >
            <table className="w-full min-w-[32rem] text-left text-sm">
              <caption className="sr-only">
                AI helper uses: free trial in total, Pro per day
              </caption>
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th scope="col" className="p-3 font-semibold">
                    AI helper
                  </th>
                  <th scope="col" className="p-3 font-semibold">
                    Without an account
                  </th>
                  <th scope="col" className="p-3 font-semibold">
                    Free account (one-time trial)
                  </th>
                  <th scope="col" className="p-3 font-semibold">
                    Pro (every day)
                  </th>
                </tr>
              </thead>
              <tbody>
                {ORDER.filter((k) => AI_KINDS.includes(k)).map((k, i) => (
                  <tr
                    key={k}
                    className="border-t border-zinc-200 dark:border-zinc-800"
                  >
                    <th scope="row" className="p-3 font-medium">
                      {KIND_LABEL[k]}
                    </th>
                    {/* AG-1: once sign-ups are open, AI needs an account. */}
                    {!guestSample ? (
                      <td className="p-3">{TIER_LIMITS.guest[k]}</td>
                    ) : i === 0 ? (
                      <td
                        rowSpan={
                          ORDER.filter((x) => AI_KINDS.includes(x)).length
                        }
                        className="p-3 align-top"
                      >
                        Sign up to use AI
                      </td>
                    ) : null}
                    <td className="p-3">
                      {TIER_LIMITS.free[k]} {TIER_LIMITS.free[k] === 1 ? "try" : "tries"}
                    </td>
                    <td className="p-3 font-semibold">{TIER_LIMITS.pro[k]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="faq" className="mt-14 max-w-3xl">
          <h2 id="faq" className="text-2xl font-semibold">
            Questions
          </h2>
          <dl className="mt-4 flex flex-col gap-6">
            {FAQ.map((f) => (
              <div key={f.q}>
                <dt className="text-lg font-semibold">{f.q}</dt>
                <dd className="mt-1 leading-7 text-zinc-700 dark:text-zinc-300">
                  {f.a}
                  {f.q.startsWith("Can I get a refund") && (
                    <>
                      {" "}
                      <Link
                        href="/refunds"
                        className="text-violet-800 underline underline-offset-2 dark:text-violet-300"
                      >
                        Read the refund policy
                      </Link>
                      .
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}
