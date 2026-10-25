import type { Metadata } from "next";
import { muted } from "@/components/ui";

export const metadata: Metadata = {
  title: "How we rank",
  description: "How Xplaind picks courses, how links are checked, and how the site earns money.",
};

// ED-3. Draft wording for the owner to review before launch (slice S7 finishes the
// trust pages). Keep it true to the code: ranking ignores affiliate fields (ED-2).
export default function HowWeRankPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 leading-7 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:mt-1 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
      <h1 className="text-3xl font-semibold tracking-tight">How we rank</h1>
      <p className={muted}>Draft. This page will be reviewed before launch.</p>

      <h2>How a course is picked</h2>
      <p>
        Every step on the roadmap teaches one thing. For each step an editor picks one main course and up to two
        alternatives. The editor scores each course from 0 to 5 on five things:
      </p>
      <ul>
        <li>Fit: does it teach exactly this step, at this level?</li>
        <li>Quality: is it clear, correct and well made?</li>
        <li>Currency: is it up to date?</li>
        <li>Hands-on: do you build or practise something?</li>
        <li>Cost: free first. A paid pick must earn its place, and we aim for about ₹400.</li>
      </ul>
      <p>
        Each card says why we picked the course, what it costs, how long it takes and when a person last opened it
        to check the access and price. A rupee price always shows the date it was checked.
      </p>

      <h2>No one can pay for a place</h2>
      <p>
        There are no ads and no sponsored placements. No course provider can pay to be listed, moved up or kept
        on the roadmap.
      </p>

      <h2>How the site earns money</h2>
      <p>
        Some links, mostly to books, are affiliate links: if you buy, we may earn a small commission at no extra
        cost to you. Every affiliate link is labelled on its card. The code that orders courses never reads
        whether a link earns a commission, and an automated test checks that on every change.
      </p>

      <h2>How links are checked</h2>
      <p>
        From launch, a weekly job opens every link. A link that is gone is fixed or replaced. Some sites block
        automated checks, so a blocked check is never shown to you as a broken link; a person looks instead. Each
        card shows the date its link was last checked.
      </p>

      <h2>Found a wrong or broken link?</h2>
      <p>A way to report it from each card is coming before launch.</p>
    </main>
  );
}
