import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { BUSINESS } from "@/lib/business";
import { paymentProvider, providerName } from "@/lib/billing/config";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Privacy policy",
  description: "What Xplaind stores, why, who processes it, how long it is kept and how to delete it. No ads and no tracking scripts.",
  path: "/privacy",
});

const UPDATED = "13 November 2026";

const contact: string = BUSINESS.email;

const H2 = "mt-12 text-2xl font-semibold tracking-tight";
const P = "mt-3 leading-7 text-zinc-800 dark:text-zinc-200";
const A = "font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300";

const STORED: [string, string, string][] = [
  [
    "Your progress without an account",
    "Lessons you mark, test results, flashcards, your weekly plan and settings.",
    "Only in your browser. It never reaches our servers. Clear your browser's site data to remove it.",
  ],
  [
    "Your account (18 and over only)",
    "Email address, the role you chose, weekly hours, level, lesson progress, test attempts, practice ratings, and, if you opt in to the Monday emails under “Stay on track”, that choice with your email so we can send one email a week for 13 weeks (stop any time with the link in each email). If you sign in with Google or GitHub, we receive your email and name from them.",
    "Until you delete your account in Settings, which removes all of it at once.",
  ],
  [
    "Sign-in timeout (accounts only)",
    "A small cookie on this site with the time of your last visit. It is never sent anywhere else and is not used for tracking.",
    "So we can sign you out after 7 days away, or 30 days after you signed in, whichever comes first. It lasts 30 days.",
  ],
  [
    "A roadmap PDF request",
    "Name, email, experience and, only if you give it, a phone number, with the consent you ticked.",
    "To send that roadmap's updates and tips. Kept until you ask us to delete it. Under-18s get the PDF without giving any details.",
  ],
  [
    "AI helper use",
    "For accounts: how many AI requests you made each day and their size, to keep within daily limits. For visitors without an account: the same counts under a short code made from your network address that changes every day; the address itself is not stored.",
    "Counts are kept to enforce limits and our monthly spending cap. What you type into the AI tutor, resume review or book helper is not saved by us.",
  ],
  [
    "Pro pass payments (18 and over only)",
    `The pass you bought, its price, the date, our order number, ${providerName()}'s payment reference, and when your pass ends. Your mobile number goes to ${providerName()} for the payment and is not stored by us. We never see or store card, UPI or bank details.`,
    "Kept for 8 years for tax and accounting, as the law requires. If you delete your account, the record stays but is no longer linked to you.",
  ],
  [
    "Course link clicks",
    "Which course was opened, from which lesson. No user id and no network address.",
    "To learn which picks help. Kept as plain counts.",
  ],
];

const PROCESSORS: [string, string][] = [
  ["Vercel", "Hosts the website."],
  ["Supabase", "Stores accounts and the data above, and sends sign-in emails."],
  ["Google and GitHub", "Only if you choose to sign in with them."],
  [
    paymentProvider() === "razorpay" ? "Razorpay" : "Cashfree Payments",
    "Takes payments for Pro passes, only if you buy one. It receives the amount, your email and mobile number, and handles your UPI, card or bank details itself.",
  ],
  ["Anthropic", "Writes AI answers. It receives only the text of that request, such as your question, your code and its error, or your resume text, when you press the button."],
  ["YouTube", "Plays videos inside lessons from its privacy-enhanced (no-cookie) player, and only after you press play."],
  ["jsDelivr", "Delivers the Python engine for the code playground the first time you press Run. Your code runs in your browser and is not sent anywhere."],
];

/** PV-3: every processor, the purpose and retention of each kind of data, and how to delete it. */
export default function PrivacyPage() {
  return (
    <main>
      <PageHero
        theme="security"
        shape="shield"
        icon="shield"
        eyebrow="Privacy"
        title="Privacy policy"
        lead="The short version: no ads, no tracking scripts, nothing sold. Without an account, your progress never leaves your device."
      >
        <p className="text-sm text-zinc-700 dark:text-zinc-300">Last updated {UPDATED}.</p>
      </PageHero>

      <div className="mx-auto max-w-3xl px-4 pt-4 pb-16 md:px-6">
        <h2 className={H2}>Who we are</h2>
        <p className={P}>
          Xplaind (xplaind.in) is a brand of {BUSINESS.legalName} (GSTIN {BUSINESS.gstin}), which is responsible for your data. Contact us at{" "}
          <a href={`mailto:${BUSINESS.email}`} className={A}>
            {BUSINESS.email}
          </a>{" "}
          or {BUSINESS.phone}.
        </p>

        <h2 className={H2}>What we store, why and for how long</h2>
        <ul className="mt-5 flex flex-col gap-4">
          {STORED.map(([what, data, why]) => (
            <li key={what} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-lg font-semibold">{what}</h3>
              <p className="mt-2 leading-7 text-zinc-800 dark:text-zinc-200">
                <span className="font-medium">What: </span>
                {data}
              </p>
              <p className="mt-1 leading-7 text-zinc-700 dark:text-zinc-300">
                <span className="font-medium">Why and how long: </span>
                {why}
              </p>
            </li>
          ))}
        </ul>
        <p className={P}>We never ask for a photo, a government ID or your precise location, and we never sell or rent your data.</p>

        <h2 className={H2}>Who processes it</h2>
        <dl className="mt-5 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {PROCESSORS.map(([name, why]) => (
            <div key={name} className="grid gap-1 p-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
              <dt className="font-semibold">{name}</dt>
              <dd className="leading-7 text-zinc-700 dark:text-zinc-300">{why}</dd>
            </div>
          ))}
        </dl>

        <h2 className={H2}>Cookies and analytics</h2>
        <p className={P}>
          We use no advertising or tracking cookies and no analytics scripts. If you make an account, a sign-in cookie keeps you signed in. Your
          progress and settings without an account live in your browser&apos;s own storage, which only this site can read. If you open a
          friend&apos;s invite link, a cookie remembers their code for 30 days so your first pass gets the friend discount.
        </p>
        <p className={P}>
          To see whether the site works, we count a few steps each day: sign-ups, first lessons finished, AI trial turns used, visits to the
          pricing page, checkouts started, purchases and invite-link visits. Each is one number per day, with nothing about who did it: no
          name, no account, no device or network address.
        </p>

        <h2 className={H2}>Under 18</h2>
        <p className={P}>
          Accounts are for people aged 18 and over. Anyone younger can use everything that does not need an account, and nothing about them is
          stored on our servers.
        </p>

        <h2 className={H2}>Your choices</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-zinc-800 dark:text-zinc-200">
          <li>
            Delete your account and everything saved with it from{" "}
            <Link href="/settings" className={A}>
              Settings
            </Link>
            .
          </li>
          <li>
            Ask for a copy of your data, a correction, an end to our emails, or deletion of a roadmap PDF request
            {contact ? (
              <>
                {" "}
                by writing to{" "}
                <a href={`mailto:${contact}`} className={A}>
                  {contact}
                </a>
              </>
            ) : (
              " by replying to any email we sent you"
            )}
            .
          </li>
        </ul>

        <h2 className={H2}>Changes</h2>
        <p className={P}>If this policy changes, the date at the top of this page changes with it.</p>
        <p className="mt-10 text-sm text-zinc-600 dark:text-zinc-400">
          See also our{" "}
          <Link href="/terms" className={A}>
            terms of use
          </Link>{" "}
          and{" "}
          <Link href="/disclosure" className={A}>
            affiliate disclosure
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
