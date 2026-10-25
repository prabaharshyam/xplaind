import type { Metadata } from "next";
import Link from "next/link";
import { muted } from "@/components/ui";
import { getPaths } from "@/lib/content";
import { pathView } from "@/lib/content/paths";
import { CODING_LABEL, roadmapHref } from "@/lib/paths";
import { YourPath } from "./your-path";

export const metadata: Metadata = {
  title: "Choose a path",
  description: "Nine AI career paths, from AI for beginners to forward deployed engineer, each with lessons, free courses and projects.",
};

export default function PathsPage() {
  const paths = getPaths().map(pathView);
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">Choose a path</h1>
      <p className="mt-3 max-w-2xl leading-7 text-zinc-700 dark:text-zinc-300">
        Each path is an ordered route through one shared library of lessons, so what you finish on one path counts on
        every other. Every lesson has our own explanation, the best free course for it and a check, and every stage
        ends in a project.
      </p>
      <YourPath paths={paths.map((p) => ({ id: p.id, name: p.name }))} />
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {paths.map((p) => (
          <li key={p.id}>
            <Link
              href={roadmapHref(p.id)}
              className="flex h-full flex-col gap-3 rounded-xl border border-zinc-200 p-5 hover:border-emerald-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              <h2 className="text-xl font-semibold">{p.name}</h2>
              <p className="leading-7">{p.tagline}</p>
              <p className={`mt-auto text-sm ${muted}`}>
                {CODING_LABEL[p.coding]} · about {p.months} {p.months === 1 ? "month" : "months"} · {p.stages.length} stages ·{" "}
                {p.counts.lessons} lessons{p.counts.planned > 0 ? `, ${p.counts.planned} more being written` : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
