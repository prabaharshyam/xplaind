import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { AI_KINDS, type AiKind } from "@/lib/ai/limits";
import { activePayments, paymentProvider, proOpen, providerName } from "@/lib/billing/config";
import { KIND_LABEL, PLANS, TIER_LIMITS, type PlanId, monthlyEquivalentPaise, perDay, rupees, savingPercent } from "@/lib/billing/plans";
import { BUSINESS } from "@/lib/business";
import { getTestimonials } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import { BuyPass } from "./buy-pass";
import { secondaryButton } from "@/components/ui";
import { FunnelPing } from "@/components/funnel-ping";

export const metadata: Metadata = pageMeta({
  title: "Xplaind Pro: Get Interview-Ready, with Proof, from ₹99",
  description:
    "Roadmaps and lessons stay free with your account. Xplaind Pro adds mock interviews with a readiness score, AI project reviews, resume-to-job match, a verified certificate and an AI tutor in your language. 7 days for ₹99, 6 months for ₹999, 7-day refund.",
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
    a: "If you are preparing for placements or a job switch, the 6-month pass covers a full season of practice for ₹999. The 12-month pass costs the least per day. The 30-day pass is a low-cost way to try Pro, and the 7-day pass is for an interview this week.",
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
    q: "How do I get a certificate?",
    a: "Finish every lesson on a role's roadmap, pass the quick check (or a project) on at least 80% of them, and pass the AI review of one of the role's guided projects. Then a Pro account can claim the certificate, with a public link anyone can check and an Add to LinkedIn button. It shows what you did on Xplaind; it is not a university or government qualification.",
  },
  {
    q: "Why charge for AI help?",
    a: "Each AI answer costs us money to run. Every account can try each AI helper a few times for free; a pass covers the cost of regular use, so Xplaind stays independent, with no ads and no sponsored rankings.",
  },
  {
    q: "Does it renew by itself?",
    a: "No. A pass is one payment for 7 days, 30 days, 6 months or 12 months. When it ends you go back to a free account, and you buy again only if you want to. Buying while a pass runs adds the time on at the end.",
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
    a: "No. Accounts and passes are for people aged 18 and over. Without an account you can still read the quick answer and the first part of every lesson and preview every roadmap.",
  },
];

/** PAY-8: the pricing page, built to show value and outcomes first and keep the choice simple. */
export default function PricingPage() {
  const open = proOpen();
  const sandbox = activePayments()?.mode === "sandbox";
  const provider = paymentProvider();
  const rows = ORDER.filter((k) => AI_KINDS.includes(k));
  const testimonials = getTestimonials();
  const outcomes = testimonials.filter((t) => t.outcome && t.outcome_on);
  const stories = (outcomes.length ? outcomes : testimonials).slice(0, 3);
  return (
    <main>
      <FunnelPing event="pricing_view" />
      {/* Hero: the promise, the lowest daily price, and the four reasons it is safe to try. */}
      <section aria-labelledby="pricing-h" className="mx-auto max-w-6xl px-4 pt-12 pb-10 md:px-6 md:pt-20 md:pb-14">
        <h1 id="pricing-h" className="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-6xl">
          Get interview-ready, with proof
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-800 md:text-xl dark:text-zinc-200">
          Your roadmap and lessons stay free. Pro tells you when you are ready for interviews and gives you things to show a recruiter: a
          readiness score, reviewed projects, a resume matched to the job and a certificate anyone can check. From {perDay(PLANS.pass_year)} a day.
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
                    <span className="text-sm font-medium text-violet-800 dark:text-violet-300">Recommended</span>
                  ) : save ? (
                    <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
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
        {/* PAY-11: a small first purchase, for an interview this week. */}
        <div className="mt-5 flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:px-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h3 className="text-lg font-semibold">
              {PLANS.pass_week.name}, {rupees(PLANS.pass_week.paise)}
            </h3>
            <p className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300">Interview this week? Everything in Pro for 7 days, {perDay(PLANS.pass_week)} a day. One payment.</p>
          </div>
          <div className="sm:w-56 sm:shrink-0">
            {open ? (
              <BuyPass provider={provider} planId="pass_week" label={PLANS.pass_week.name} price={rupees(PLANS.pass_week.paise)} />
            ) : (
              <p className="text-sm text-zinc-700 dark:text-zinc-300">Online payment opens shortly</p>
            )}
          </div>
        </div>
        <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
          Prices in Indian rupees, GST included. Every pass includes everything in Pro below.
        </p>
      </section>

      {/* OP-1: what the money buys, as outcomes first and numbers second. */}
      <section aria-labelledby="value-h" className="mx-auto mt-20 max-w-6xl px-4 md:mt-28 md:px-6">
        <h2 id="value-h" className="max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          What you walk away with
        </h2>
        <ul className="mt-10 grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              n: "Score out of 100",
              t: "Know when you are interview-ready",
              d: `Take up to ${TIER_LIMITS.pro.interview} mock interviews a day for your role. Each one is reviewed and adds to a readiness score, so you can see yourself getting closer.`,
            },
            {
              n: "Pass or fix",
              t: "Projects a recruiter will trust",
              d: "Link your GitHub project and get it marked against the project's rubric, criterion by criterion, with what to fix before you show it.",
            },
            {
              n: "Match %",
              t: "A resume matched to the job",
              d: `Up to ${TIER_LIMITS.pro.resume} resume reviews a day: line-by-line fixes, a match score against the job post, and a LinkedIn headline and About section written from your resume.`,
            },
            {
              n: "Verified",
              t: "A certificate anyone can check",
              d: "Earn it by passing the checks and a reviewed project, not by clicking through. It has a public link and an Add to LinkedIn button.",
            },
            {
              n: `${TIER_LIMITS.pro.tutor} a day`,
              t: "Never stuck, in your language",
              d: "Ask the AI tutor about any lesson, your code or your plan, in English, Hinglish, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali or Gujarati.",
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
        <p className="mt-10 max-w-3xl rounded-2xl bg-zinc-50 p-5 leading-7 dark:bg-zinc-900">
          <span className="font-semibold">Free with every account: </span>
          every roadmap, lesson, video, practice card and project guide, a 2-minute level check, a week-by-week plan to your interview date and a
          public profile you can share.
        </p>
      </section>

      {/* OS-1: real learners only. Outcomes first when there are any; otherwise their words. */}
      {stories.length > 0 && (
        <section aria-labelledby="stories-h" className="mx-auto mt-20 max-w-6xl px-4 md:mt-28 md:px-6">
          <h2 id="stories-h" className="text-3xl font-semibold tracking-tight md:text-4xl">
            {outcomes.length ? "What learners achieved" : "What learners say"}
          </h2>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {stories.map((t) => (
              <li key={t.name}>
                <figure className="h-full rounded-3xl bg-zinc-50 p-6 dark:bg-zinc-900">
                  {t.outcome && <p className="font-semibold text-emerald-800 dark:text-emerald-300">{t.outcome}</p>}
                  <blockquote className="mt-2 leading-7 text-zinc-800 dark:text-zinc-200">“{t.excerpt ?? t.quote}”</blockquote>
                  <figcaption className="mt-3 text-sm font-medium">
                    {t.name}, <span className="font-normal text-zinc-700 dark:text-zinc-300">{t.role}</span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
          <Link href="/stories" className="mt-5 inline-flex min-h-11 items-center font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300">
            Read learner stories
          </Link>
        </section>
      )}

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

      {/* CB-1: batches for colleges, institutes and companies. */}
      <section aria-labelledby="batch-h" className="mx-auto mt-20 max-w-6xl px-4 md:mt-28 md:px-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between md:p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <h2 id="batch-h" className="text-2xl font-semibold tracking-tight">
              Buying for a batch?
            </h2>
            <p className="mt-1 leading-7 text-zinc-700 dark:text-zinc-300">Colleges, training institutes and companies can get Pro for 10 or more learners, with one invoice with GST.</p>
          </div>
          <Link href="/colleges" className={`${secondaryButton} shrink-0`}>
            Plans for colleges
          </Link>
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
          Xplaind sells one thing: <strong className="font-semibold">Pro passes</strong>, a one-time payment for 7 days, 30 days, 6 months or 12 months
          of higher limits on the AI helpers (AI tutor, interview feedback, mock interview reports, project review, resume review and study from your notes)
          and verified certificates.
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
