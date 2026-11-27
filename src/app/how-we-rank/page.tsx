import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { textLink } from "@/components/ui";
import { proOpen } from "@/lib/billing/config";

export const metadata: Metadata = {
  alternates: { canonical: "/how-we-rank" },
  title: "How we rank",
  description: "How Xplaind picks the best course for each topic, checks every link and price, earns money from Pro passes and book links, and keeps both out of the ranking.",
};

// ED-3. Keep it true to the code: ranking ignores affiliate fields and Pro passes (ED-2).
export default function HowWeRankPage() {
  const pro = proOpen();
  // UX-22 (2026-11-27, owner: "don't have sections with so much text"): steps, score chips and one-line cards. The
  // full detail on money stays one tap away.
  const SCORES = [
    { t: "Fit", d: "Teaches exactly this step" },
    { t: "Quality", d: "Clear, correct, well made" },
    { t: "Currency", d: "Up to date" },
    { t: "Hands-on", d: "You build something" },
    { t: "Cost", d: "Free first, about ₹400 if paid" },
  ];
  const PROMISES = [
    { icon: "shield" as const, t: "No one can pay for a place", d: "No ads, no sponsored places, no paying to be listed or moved up." },
    { icon: "scale" as const, t: "How we earn", d: `Pro passes${pro ? "" : " (coming soon)"} for more AI help, and labelled book links. Neither changes a ranking.` },
    { icon: "check" as const, t: "Links checked every Monday", d: "A broken link is fixed or replaced; each card shows its check date." },
  ];
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">How we rank</h1>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-zinc-700 dark:text-zinc-300">One main course for every roadmap step, picked by a person and scored in the open.</p>

      <section aria-labelledby="pick-h" className="mt-10">
        <h2 id="pick-h" className="text-xl font-semibold">How a course is picked</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {["Every roadmap step teaches one thing", "An editor picks one main course and up to two alternatives", "Each is scored 0 to 5 on five things"].map((t, i) => (
            <li key={t} className="rounded-3xl bg-zinc-50 p-4 dark:bg-zinc-900">
              <span className="grid size-8 place-items-center rounded-full bg-brand-700 text-sm font-semibold text-white dark:bg-brand-300 dark:text-brand-950">{i + 1}</span>
              <p className="mt-3 leading-6 font-medium">{t}</p>
            </li>
          ))}
        </ol>
        <ul aria-label="The five scores" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {SCORES.map((x) => (
            <li key={x.t} className="rounded-2xl bg-white p-3 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
              <p className="font-semibold">{x.t}</p>
              <p className="mt-0.5 text-sm leading-5 text-zinc-600 dark:text-zinc-400">{x.d}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Each card says why we picked it, what it costs, how long it takes and when a person last checked it. A rupee price always shows its check date.
        </p>
      </section>

      <section aria-labelledby="trust-h" className="mt-12">
        <h2 id="trust-h" className="text-xl font-semibold">What keeps it honest</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {PROMISES.map((x) => (
            <li key={x.t} className="rounded-3xl bg-white p-5 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
              <span aria-hidden="true" className="grid size-10 place-items-center rounded-2xl bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                <Icon name={x.icon} size={20} />
              </span>
              <h3 className="mt-3 font-semibold">{x.t}</h3>
              <p className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{x.d}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-2xl bg-brand-50 p-4 leading-7 font-medium text-brand-950 dark:bg-brand-950/50 dark:text-brand-100">
          The code that orders courses and books never reads whether a link earns a commission or whether you have a Pro pass, and an automated test checks that on every change.
        </p>
        <details className="group mt-4">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 font-medium text-brand-800 dark:text-brand-300 [&::-webkit-details-marker]:hidden">
            More on Pro passes, book links and link checks
            <span aria-hidden="true" className="transition-transform group-open:rotate-90">→</span>
          </summary>
          <div className="mt-2 space-y-3 leading-7 text-zinc-800 dark:text-zinc-200">
            <p>
              <strong className="font-semibold">Pro passes.</strong> The AI helpers, such as the AI tutor, mock interview feedback and resume review, cost us money every time they run. Every
              account gets a daily AI allowance. A Pro pass, for 30 days, 6 months or 12 months, gives you much more each day. It is one payment with no auto-renewal. Pro never unlocks
              lessons, because nothing is locked, and it never changes a ranking.{" "}
              {pro ? (
                <Link href="/pricing" className={textLink}>
                  See Pro passes and prices
                </Link>
              ) : (
                "Passes are not on sale yet."
              )}
            </p>
            <p>
              <strong className="font-semibold">Book links.</strong> Some links, mostly to books, are affiliate links: if you buy, we may earn a small commission at no extra cost to you.
              Every affiliate link is labelled on its card.
            </p>
            <p>
              <strong className="font-semibold">Link checks.</strong> Some sites block automated checks, so a blocked check is never shown to you as a broken link; a person looks instead.
            </p>
            <p>A way to report a wrong or broken link from each card is coming before launch.</p>
          </div>
        </details>
      </section>
    </main>
  );
}
