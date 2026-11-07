import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { PageHero } from "@/components/page-hero";
import { getPatterns } from "@/lib/content";
import { PATTERN_CATEGORIES } from "@/lib/content/schema";
import { pageMeta } from "@/lib/seo";
import { CATEGORY } from "../labels";

export const metadata: Metadata = pageMeta({
  title: "AI interview patterns: RAG, agents, evals, serving and safety",
  description: "The patterns AI engineer interviews are built on, each with when to use it, how it works, its trade-offs and the words to say it in the interview.",
  path: "/interview/patterns",
});

/** IP-1: every interview pattern, grouped by category. */
export default function PatternsPage() {
  const patterns = getPatterns();
  return (
    <main>
      <PageHero
        theme="system-design"
        seed="patterns"
        icon="flow"
        eyebrow="Interview prep"
        title="AI interview patterns"
        lead="Interviewers reuse a small set of ideas. Learn each pattern once: when to use it, how it works, what it costs, and how to say it out loud."
        crumbs={[{ href: "/interview", label: "Interview" }]}
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-10 md:px-6">
        {PATTERN_CATEGORIES.map((c) => {
          const list = patterns.filter((p) => p.category === c);
          if (list.length === 0) return null;
          return (
            <section key={c} aria-labelledby={`cat-${c}`}>
              <h2 id={`cat-${c}`} className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                <span className="grid size-9 place-items-center rounded-2xl bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200">
                  <Icon name={CATEGORY[c].icon} size={18} />
                </span>
                {CATEGORY[c].label}
              </h2>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">{CATEGORY[c].lead}</p>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/interview/patterns/${p.id}`}
                      className="flex h-full flex-col gap-2 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.03] transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <span className="text-lg font-semibold">{p.name}</span>
                      <span className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">{p.summary}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
