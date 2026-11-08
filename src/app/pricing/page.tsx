import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { PageHero } from "@/components/page-hero";
import { AI_KINDS, type AiKind } from "@/lib/ai/limits";
import { paymentsConfig, proOpen } from "@/lib/billing/config";
import { KIND_LABEL, PLANS, PLAN_IDS, TIER_LIMITS, rupees } from "@/lib/billing/plans";
import { pageMeta } from "@/lib/seo";
import { BuyPass } from "./buy-pass";

export const metadata: Metadata = pageMeta({
  title: "Pricing: lessons and roadmaps free, Pro passes from ₹249",
  description: "Every Xplaind roadmap, lesson, video, practice card and project guide is free. A Pro pass gives you more AI tutor, interview feedback and resume review each day, from ₹249.",
  path: "/pricing",
});

const ORDER: AiKind[] = ["tutor", "grade", "interview", "resume", "book", "roadmap", "bot"];

const FREE = [
  "All 9 role roadmaps and every lesson",
  "Every video lesson and video course",
  "181 interview questions with answers, and practice cards",
  "All guided project guides",
  "The code playground, with no limit",
];

const FAQ: { q: string; a: string }[] = [
  { q: "Are the roadmaps and lessons still free?", a: "Yes. Every roadmap, lesson, video, practice card, interview answer and project guide is free, with no daily limit. Pro only changes how much AI help you get each day." },
  { q: "Why charge for AI help?", a: "Each AI answer costs us money to run. The free allowance stays, and a pass covers the cost of heavier use, so Xplaind stays independent, with no ads and no sponsored rankings." },
  { q: "Does it renew by itself?", a: "No. A pass is one payment for 30 days, 6 months or 12 months. When it ends you go back to the free allowance, and you buy again only if you want to. Buying while a pass runs adds the time on at the end." },
  { q: "How can I pay?", a: "By UPI (Google Pay, PhonePe, Paytm and others), debit or credit card, or net banking, through Cashfree. We never see or store your card or UPI details." },
  { q: "Can I get a refund?", a: "Yes, within 7 days of buying. The refund policy has the details." },
  { q: "Can students under 18 buy a pass?", a: "No. Accounts and passes are for people aged 18 and over. Everything free on Xplaind works without an account." },
];

/** PAY-5: what is free, what Pro adds, and the three passes. */
export default function PricingPage() {
  const open = proOpen();
  const sandbox = paymentsConfig()?.mode === "sandbox";
  return (
    <main>
      <PageHero
        theme="career"
        shape="icon:star"
        icon="star"
        eyebrow="Pricing"
        title="Learn for free. Get more AI help with Pro."
        lead="Every roadmap, lesson and course link on Xplaind is free, for good. A Pro pass gives you much more AI tutoring, interview feedback and resume review each day."
      />
      <div className="mx-auto max-w-6xl px-4 pt-4 pb-16 md:px-6">
        {!open && (
          <p role="status" className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 leading-7 dark:border-zinc-800 dark:bg-zinc-900">
            Pro passes are not on sale yet. Until they are, everything on Xplaind, including the AI helpers, works with today&apos;s free daily limits.
          </p>
        )}
        {open && sandbox && (
          <p role="status" className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 leading-7 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
            Test mode: payments go to Cashfree&apos;s sandbox and no real money moves.
          </p>
        )}

        <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <li className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Free</h2>
            <p className="mt-2 text-3xl font-semibold">₹0</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">For everyone, always</p>
            <ul className="mt-4 flex flex-col gap-2 text-sm leading-6">
              {FREE.map((f) => (
                <li key={f} className="flex gap-2">
                  <Icon name="tick" size={16} className="mt-1 shrink-0 text-violet-700 dark:text-violet-300" />
                  {f}
                </li>
              ))}
              <li className="flex gap-2">
                <Icon name="tick" size={16} className="mt-1 shrink-0 text-violet-700 dark:text-violet-300" />
                AI helpers with a daily allowance
              </li>
            </ul>
            <Link href="/paths" className="mt-auto pt-5 font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300">
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
                {p.popular && <p className="absolute -top-3 left-5 rounded-full bg-violet-700 px-3 py-0.5 text-xs font-semibold text-white">Most popular</p>}
                <h2 className="text-lg font-semibold">{p.name}</h2>
                <p className="mt-2 text-3xl font-semibold">{rupees(p.paise)}</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{p.note}</p>
                <ul className="mt-4 flex flex-col gap-2 text-sm leading-6">
                  <li className="flex gap-2">
                    <Icon name="tick" size={16} className="mt-1 shrink-0 text-violet-700 dark:text-violet-300" />
                    Everything in Free
                  </li>
                  <li className="flex gap-2">
                    <Icon name="tick" size={16} className="mt-1 shrink-0 text-violet-700 dark:text-violet-300" />
                    {TIER_LIMITS.pro.tutor} AI tutor questions and {TIER_LIMITS.pro.grade} answer reviews a day
                  </li>
                  <li className="flex gap-2">
                    <Icon name="tick" size={16} className="mt-1 shrink-0 text-violet-700 dark:text-violet-300" />
                    {TIER_LIMITS.pro.interview} mock interview reports and {TIER_LIMITS.pro.resume} resume reviews a day
                  </li>
                  <li className="flex gap-2">
                    <Icon name="tick" size={16} className="mt-1 shrink-0 text-violet-700 dark:text-violet-300" />
                    One payment, no auto-renewal
                  </li>
                </ul>
                <div className="mt-auto pt-5">{open ? <BuyPass planId={id} label={p.name} price={rupees(p.paise)} popular={p.popular} /> : <p className="text-sm text-zinc-600 dark:text-zinc-400">On sale soon</p>}</div>
              </li>
            );
          })}
        </ul>

        <section aria-labelledby="limits" className="mt-14">
          <h2 id="limits" className="text-2xl font-semibold">
            Daily AI allowance
          </h2>
          <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">Counts reset at midnight India time. The limits keep costs fair for everyone, Pro included.</p>
          <div role="region" aria-label="Daily AI allowance table" tabIndex={0} className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 dark:border-zinc-800">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <caption className="sr-only">AI turns per day, by account</caption>
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th scope="col" className="p-3 font-semibold">
                    Each day
                  </th>
                  <th scope="col" className="p-3 font-semibold">
                    Without an account
                  </th>
                  <th scope="col" className="p-3 font-semibold">
                    Free account
                  </th>
                  <th scope="col" className="p-3 font-semibold">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {ORDER.filter((k) => AI_KINDS.includes(k)).map((k) => (
                  <tr key={k} className="border-t border-zinc-200 dark:border-zinc-800">
                    <th scope="row" className="p-3 font-medium">
                      {KIND_LABEL[k]}
                    </th>
                    <td className="p-3">{TIER_LIMITS.guest[k]}</td>
                    <td className="p-3">{TIER_LIMITS.free[k]}</td>
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
                      <Link href="/refunds" className="text-violet-800 underline underline-offset-2 dark:text-violet-300">
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
