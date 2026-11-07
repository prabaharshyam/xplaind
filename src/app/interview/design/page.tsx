import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { getDesigns } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "LLM system design interview: worked answers",
  description: "Worked answers to the LLM system design questions AI interviews ask, in the 35-minute shape: clarify, requirements, estimates, design, deep dives, failures, evals and trade-offs.",
  path: "/interview/design",
});

/** IP-2: every worked system design answer. */
export default function DesignsPage() {
  const designs = getDesigns();
  return (
    <main>
      <PageHero
        theme="system-design"
        seed="designs"
        icon="flow"
        eyebrow="Interview prep"
        title="LLM system design answers"
        lead="Worked answers to the design questions AI interviews ask, in the order you would say them in 35 minutes: clarify, size it, draw it, go deep, name the failures, prove it with evals."
        crumbs={[{ href: "/interview", label: "Interview" }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <ul className="grid gap-4 md:grid-cols-2">
          {designs.map((d) => (
            <li key={d.id}>
              <Link
                href={`/interview/design/${d.id}`}
                className="flex h-full flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="text-lg font-semibold">{d.title}</span>
                <span className="text-sm leading-6 text-zinc-600 italic dark:text-zinc-400">&ldquo;{d.prompt}&rdquo;</span>
                <span className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{d.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
