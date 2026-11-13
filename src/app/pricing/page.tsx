import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { AI_KINDS, type AiKind } from "@/lib/ai/limits";
import { activePayments, paymentProvider, proOpen, providerName } from "@/lib/billing/config";
import { KIND_LABEL, PLANS, TIER_LIMITS, type PlanId, monthlyEquivalentPaise, perDay, rupees, savingPercent } from "@/lib/billing/plans";
import { BUSINESS } from "@/lib/business";
import { pageMeta } from "@/lib/seo";
import { BuyPass } from "./buy-pass";

export const metadata: Metadata = pageMeta({
  title: "Xplaind Pro: AI Tutor, Interview Coach and Resume Review, from ₹249",
  description:
    "Roadmaps, lessons and projects stay with your account. Xplaind Pro adds a daily AI tutor, interview coach, mock interview reports and resume reviews. 6 months for ₹999, one payment, 7-day refund.",
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


const FAQ: { q: string; a: string }[] = [
  {
    q: "Which pass should I pick?",
    a: "If you are preparing for placements or a job switch, the 6-month pass covers a full season of practice for ₹999. The 12-month pass costs the least per day. The 30-day pass is a low-cost way to try Pro.",
  },
  {
    q: "What happens when my free tries run out?",
    a: "Your account can try each AI helper 2 or 3 times for free. After that, the helper asks you to get Pro. Lessons, roadmaps, videos, practice and projects never need Pro.",
  },
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

/** PAY-8: the pricing page, built to show value and outcomes first and keep the choice simple. */
export default function PricingPage() {
  const open = proOpen();
  const sandbox = activePayments()?.mode === "sandbox";
  const provider = paymentProvider();
  const rows = ORDER.filter((k) => AI_KINDS.includes(k));
  return (
    <main>
      {/* Hero: the promise, the lowest daily price, and the four reasons it is safe to try. */}
      <section aria-labelledby="pricing-h" className="mx-auto max-w-6xl px-4 pt-12 pb-10 md:px-6 md:pt-20 md:pb-14">
        <h1 id="pricing-h" className="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-6xl">
          Learn AI faster with Pro
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-800 md:text-xl dark:text-zinc-200">
          Your roadmap, lessons and projects stay with your account. Pro adds an AI tutor, interview coach and resume reviewer you can use
          every day, from {perDay(PLANS.pass_year)} a day.
        </p>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {["One payment, no auto-renewal", "Full refund within 7 days", "UPI, cards and net banking", "Price includes GST"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Icon name="tick" size={16} className="shrink-0 text-violet-700 dark:text-violet-300" />
              {t}
            </li>
          ))}
        </ul>
        {open && sandbox && (
          <p role="status" className="mt-6 rounded-2xl bg-amber-50 p-4 leading-7 text-amber-950 dark:bg-amber-950 dark:text-amber-100">
            Test mode: payments go to {providerName()}&apos;s test environment and no real money moves.
          </p>
        )}
      </section>

      {/* The three passes. The recommended one comes first on a phone and sits in the middle on a wide screen. */}
      <section aria-labelledby="plans-h" className="mx-auto max-w-6xl px-4 md:px-6">
        <h2 id="plans-h" className="sr-only">
          Choose your Pro pass
        </h2>
        <ul className="grid items-stretch gap-5 md:grid-cols-3">
          {(["pass_month", "pass_6month", "pass_year"] as PlanId[]).map((id) => {
            const p = PLANS[id];
            const save = p.months > 1 ? savingPercent(p) : 0;
            const best = p.popular;
            return (
              <li
                key={id}
                className={`flex flex-col rounded-3xl p-6 md:p-7 ${best ? "order-first bg-violet-50 ring-2 ring-violet-700 md:order-none dark:bg-violet-950/50 dark:ring-violet-400" : "bg-zinc-50 dark:bg-zinc-900"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  {best ? (
                    <span className="rounded-full bg-violet-700 px-3 py-1 text-xs font-semibold text-white">Recommended</span>
                  ) : save ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                      Best value
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{p.note}</p>
                <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="text-5xl font-semibold tracking-tight">{rupees(p.paise)}</p>
                  {save > 0 && (
                    <p className="text-lg text-zinc-600 dark:text-zinc-400">
                      <s>{rupees(monthlyEquivalentPaise(p))}</s>
                      <span className="sr-only"> if bought month by month</span>
                    </p>
                  )}
                </div>
                {save > 0 ? (
                  <p className="mt-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    Save {save}% compared with {p.months} monthly passes
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">The easiest way to try Pro</p>
                )}
                <p className="mt-4 text-base">
                  <span className="font-semibold">{perDay(p)} a day</span>
                  <span className="text-zinc-700 dark:text-zinc-300"> · {p.days} days of Pro · one payment</span>
                </p>
                <div className="mt-auto pt-6">
                  {open ? (
                    <BuyPass provider={provider} planId={id} label={p.name} price={rupees(p.paise)} popular={best} />
                  ) : (
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">Online payment opens shortly</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
          Prices in Indian rupees, GST included. Every pass includes everything in Pro below.
        </p>
      </section>

      {/* What the money buys, as outcomes first and numbers second. */}
      <section aria-labelledby="value-h" className="mx-auto mt-20 max-w-6xl px-4 md:mt-28 md:px-6">
        <h2 id="value-h" className="max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          What Pro does for you
        </h2>
        <ul className="mt-10 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {[
            {
              n: `${TIER_LIMITS.pro.tutor} a day`,
              t: "Never stay stuck on a lesson",
              d: "Ask the AI tutor anything about the lesson you are reading, your code or your plan, and get a clear answer with the lessons to read next.",
            },
            {
              n: `${TIER_LIMITS.pro.grade} + ${TIER_LIMITS.pro.interview} a day`,
              t: "Walk into interviews prepared",
              d: `Get ${TIER_LIMITS.pro.grade} answer reviews and ${TIER_LIMITS.pro.interview} full mock interview reports a day: what you covered, what you missed, and a stronger answer to practise.`,
            },
            {
              n: `${TIER_LIMITS.pro.resume} a day`,
              t: "Send a resume that gets read",
              d: "Paste your resume and the role you want. Get line-by-line fixes, the skills to add and how it reads to a recruiter.",
            },
            {
              n: `${TIER_LIMITS.pro.book} + ${TIER_LIMITS.pro.notes} a day`,
              t: "Revise from your own notes",
              d: `Turn a PDF of your notes into ${TIER_LIMITS.pro.book} tests or flashcard decks a day, and ask up to ${TIER_LIMITS.pro.notes} questions answered only from your file.`,
            },
          ].map((v) => (
            <li key={v.t}>
              <p className="text-3xl font-semibold tracking-tight text-violet-800 dark:text-violet-300">{v.n}</p>
              <h3 className="mt-2 text-xl font-semibold">{v.t}</h3>
              <p className="mt-2 max-w-md leading-7 text-zinc-800 dark:text-zinc-200">{v.d}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Free against Pro, plainly. */}
      <section aria-labelledby="compare-h" className="mx-auto mt-20 max-w-6xl px-4 md:mt-28 md:px-6">
        <h2 id="compare-h" className="text-3xl font-semibold tracking-tight md:text-4xl">
          Free account or Pro
        </h2>
        <div role="region" aria-label="Free account and Pro compared" tabIndex={0} className="mt-8 overflow-x-auto rounded-3xl bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 dark:bg-zinc-900">
          <table className="w-full min-w-[30rem] text-left">
            <caption className="sr-only">AI helper uses: free trial in total, Pro per day</caption>
            <thead>
              <tr className="text-sm">
                <th scope="col" className="p-4 font-semibold md:px-6">
                  What you get
                </th>
                <th scope="col" className="p-4 font-semibold md:px-6">
                  Free account
                </th>
                <th scope="col" className="p-4 font-semibold text-violet-800 md:px-6 dark:text-violet-300">
                  Pro
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-zinc-200 dark:border-zinc-800">
                <th scope="row" className="p-4 font-medium md:px-6">
                  Roadmaps, lessons, videos, practice and projects
                </th>
                <td className="p-4 md:px-6">Unlimited</td>
                <td className="p-4 font-semibold md:px-6">Unlimited</td>
              </tr>
              {rows.map((k) => (
                <tr key={k} className="border-t border-zinc-200 dark:border-zinc-800">
                  <th scope="row" className="p-4 font-medium md:px-6">
                    {KIND_LABEL[k]}
                  </th>
                  <td className="p-4 md:px-6">
                    {TIER_LIMITS.free[k]} {TIER_LIMITS.free[k] === 1 ? "try" : "tries"} in total
                  </td>
                  <td className="p-4 font-semibold md:px-6">{TIER_LIMITS.pro[k]} every day</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Risk reversal. */}
      <section aria-labelledby="refund-h" className="mt-20 bg-violet-700 text-white md:mt-28">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-[1.4fr_1fr] md:items-center md:px-6 md:py-16">
          <div>
            <h2 id="refund-h" className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              Try Pro for 7 days, risk free
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-8">
              If Pro is not for you, ask within 7 days of buying and get the full amount back, whatever the reason. A pass never renews by
              itself, so there is nothing to cancel.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <a href="#plans-h" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-violet-900 transition hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.97]">
              Choose your pass
            </a>
            <Link href="/refunds" className="text-sm font-medium underline underline-offset-4">
              Read the refund policy
            </Link>
          </div>
        </div>
      </section>

      {/* Questions, folded so the page stays short. */}
      <section aria-labelledby="faq" className="mx-auto mt-20 max-w-3xl px-4 md:mt-28 md:px-6">
        <h2 id="faq" className="text-3xl font-semibold tracking-tight md:text-4xl">
          Questions
        </h2>
        <div className="mt-8 flex flex-col gap-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-2xl bg-zinc-50 dark:bg-zinc-900">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden="true" className="shrink-0 text-2xl leading-none text-violet-700 transition-transform group-open:rotate-45 dark:text-violet-300">
                  +
                </span>
              </summary>
              <p className="px-5 pb-5 leading-7 text-zinc-800 dark:text-zinc-200">
                {f.a}
                {f.q.startsWith("Can I get a refund") && (
                  <>
                    {" "}
                    <Link href="/refunds" className="text-violet-800 underline underline-offset-2 dark:text-violet-300">
                      Read the refund policy
                    </Link>
                    .
                  </>
                )}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* BIZ-1: what is sold, by whom, and how it is delivered, for learners and the payment gateway. */}
      <section aria-labelledby="what-h" className="mx-auto mt-20 max-w-3xl px-4 pb-20 md:px-6">
        <h2 id="what-h" className="text-lg font-semibold">
          What you can buy
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          Xplaind sells one thing: <strong className="font-semibold">Pro passes</strong>, a one-time payment for 30 days, 6 months or 12 months
          of higher limits on the AI helpers (AI tutor, interview feedback, mock interview reports, resume review and study from your notes).
          Lessons, roadmaps, videos, practice and project guides need no pass. All prices are in Indian rupees and include GST. A pass is a
          digital service that starts on your account as soon as the payment is confirmed; nothing is shipped, and nothing renews by itself.
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
            Online payment for passes opens shortly. Until then, everything on Xplaind, including the AI helpers, works as usual.
          </p>
        )}
      </section>
    </main>
  );
}
