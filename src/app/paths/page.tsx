import type { Metadata } from "next";
import Link from "next/link";
import { Cover } from "@/components/art/cover";
import { PageHero } from "@/components/page-hero";
import { muted } from "@/components/ui";
import { getPaths } from "@/lib/content";
import { pathView } from "@/lib/content/paths";
import { CODING_LABEL, roadmapHref } from "@/lib/paths";
import { YourPath } from "./your-path";

export const metadata: Metadata = {
  title: "AI career roadmaps: choose your role",
  description: "Nine AI career paths, from AI for beginners to forward deployed engineer, each with lessons, free courses and projects.",
};

export default function PathsPage() {
  const paths = getPaths().map(pathView);
  return (
    <main>
      <PageHero
        theme="career"
        seed="paths"
        icon="map"
        eyebrow="Role roadmaps"
        title="Choose your AI role"
        lead="Nine step-by-step roadmaps. Every topic has a plain-English lesson, the best free course and a check, and every stage ends in a project. Lessons are shared, so what you finish on one roadmap counts on every other."
      />
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <YourPath paths={paths.map((p) => ({ id: p.id, name: p.name }))} />
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((p) => (
            <li key={p.id} className="lx-rise">
              <Link data-tilt
                href={roadmapHref(p.id)}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Cover theme={p.theme ?? "llm"} seed={p.id} className="h-28" iconSize={36} />
                <span className="flex flex-1 flex-col gap-2 p-5">
                  <h2 className="text-xl font-semibold group-hover:underline">{p.name}</h2>
                  <span className="leading-7">{p.tagline}</span>
                  <span className={`mt-auto flex flex-wrap gap-1.5 pt-2 text-xs ${muted}`}>
                    {[
                      CODING_LABEL[p.coding],
                      `about ${p.months} ${p.months === 1 ? "month" : "months"}`,
                      `${p.stages.length} stages`,
                      `${p.counts.lessons} lessons`,
                    ].map((c) => (
                      <span key={c} className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                        {c}
                      </span>
                    ))}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
