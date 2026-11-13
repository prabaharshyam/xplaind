import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHero } from "@/components/page-hero";
import { BUSINESS } from "@/lib/business";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Terms of use",
  description: "The plain-English terms for using Xplaind's AI roadmaps, lessons, AI helpers and tools.",
  path: "/terms",
});

const UPDATED = "13 November 2026";

const A = "font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300";

const TERMS: { title: string; body: ReactNode }[] = [
  {
    title: "Who we are",
    body: (
      <>
        Xplaind (xplaind.in) is a brand of {BUSINESS.legalName}, GSTIN {BUSINESS.gstin}. In these terms, &ldquo;we&rdquo; means {BUSINESS.legalName}. You can reach us at{" "}
        <a href={`mailto:${BUSINESS.email}`} className={A}>
          {BUSINESS.email}
        </a>{" "}
        or {BUSINESS.phone}; see our{" "}
        <Link href="/contact" className={A}>
          contact page
        </Link>
        .
      </>
    ),
  },
  {
    title: "Using Xplaind",
    body: "You may use Xplaind's roadmaps, lessons, videos, practice and project guides for your own learning. You may share links to any page. Please do not copy lessons in bulk, resell them, or try to break, overload or scrape the site.",
  },
  {
    title: "Accounts",
    body: "Accounts are for people aged 18 and over. Keep your sign-in safe; you are responsible for what happens under your account. You can delete it at any time in Settings.",
  },
  {
    title: "Pro passes",
    body: (
      <>
        A Pro pass is a one-time payment for 30 days, 6 months or 12 months of higher daily AI limits. Prices are in Indian rupees and include GST. It does not renew by itself. Payments are taken by Cashfree. Passes are for people aged 18 and over, are for your own use, and cannot be shared or resold. The limits are listed on the{" "}
        <Link href="/pricing" className={A}>
          pricing page
        </Link>
        ; if we have to switch AI off for more than a day, write to us and we add those days to your pass. Refunds follow our{" "}
        <Link href="/refunds" className={A}>
          refund policy
        </Link>
        .
      </>
    ),
  },
  {
    title: "Learning, not a guarantee",
    body: "Lessons, roadmaps, salary ranges and market numbers are a guide, written carefully and dated, but we cannot promise they are complete or current, and following them does not guarantee a job, a salary or an exam result.",
  },
  {
    title: "AI helpers can be wrong",
    body: "The AI tutor, resume review, interview feedback and book helper write answers with AI. Check anything important before you rely on it. Each has a daily limit, which a Pro pass raises, and we may pause them at any time.",
  },
  {
    title: "Your content",
    body: "Code, answers, resumes and books you give the AI helpers stay yours. We use them only to write the answer you asked for, and we do not save them.",
  },
  {
    title: "Other sites",
    body: (
      <>
        Courses, videos, books and job links take you to other sites with their own terms and prices. Some book links are affiliate links; see
        our{" "}
        <Link href="/disclosure" className={A}>
          affiliate disclosure
        </Link>{" "}
        and{" "}
        <Link href="/how-we-rank" className={A}>
          how we rank
        </Link>
        .
      </>
    ),
  },
  {
    title: "Changes",
    body: "We may change the site and these terms as Xplaind grows. The date at the top shows the latest version; using the site after a change means you accept it.",
  },
];

/** PV-3's companion: the terms of use, in plain English. */
export default function TermsPage() {
  return (
    <main>
      <PageHero theme="governance" shape="icon:scale" icon="scale" eyebrow="Terms" title="Terms of use" lead="Plain-English rules for using Xplaind. The short version: learn freely, be kind to the site, and check what AI tells you.">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">Last updated {UPDATED}.</p>
      </PageHero>
      <div className="mx-auto max-w-3xl px-4 pt-4 pb-16 md:px-6">
        <ol className="mt-8 flex flex-col gap-8">
          {TERMS.map((t, i) => (
            <li key={t.title} className="grid grid-cols-[2.5rem_1fr] gap-3">
              <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-violet-50 font-semibold text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                {i + 1}
              </span>
              <div>
                <h2 className="text-xl font-semibold">{t.title}</h2>
                <p className="mt-2 leading-7 text-zinc-800 dark:text-zinc-200">{t.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-12 text-sm text-zinc-600 dark:text-zinc-400">
          How we handle your data is in our{" "}
          <Link href="/privacy" className={A}>
            privacy policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
