import type { Metadata } from "next";
import Link from "next/link";
import { Cover } from "@/components/art/cover";
import { PageHero } from "@/components/page-hero";
import { getStops } from "@/lib/content";
import { THEMES } from "@/lib/themes";

export const metadata: Metadata = {
  title: "AI topics: free lessons on RAG, agents, Python, ML and more",
  description: "Every Xplaind lesson grouped by topic: language models, RAG, agents, evaluation, deployment, machine learning, automation, product and more.",
  alternates: { canonical: "/topics" },
};

export default function TopicsPage() {
  const stops = getStops();
  const topics = THEMES.map((t) => ({ ...t, lessons: stops.filter((s) => s.theme === t.id) })).filter((t) => t.lessons.length > 0);
  return (
    <main>
      <PageHero theme="ai-basics" seed="topics" icon="compass" eyebrow="Topic roadmaps" title="Learn one AI skill at a time" lead="Want RAG, agents or Python without following a whole role? Every lesson, grouped by subject. Each one takes about 20 minutes to read." />
      <ul className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3 md:px-6">
        {topics.map((t) => (
          <li key={t.id} className="lx-rise">
            <Link data-tilt href={`/topics/${t.id}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:border-zinc-800 dark:bg-zinc-900">
              <Cover theme={t.id} seed={`topic-${t.id}`} className="h-28" iconSize={36} />
              <span className="p-4">
                <span className="block text-lg font-semibold group-hover:underline">{t.label}</span>
                <span className="mt-1 block text-sm text-zinc-600 dark:text-zinc-400">
                  {t.lessons.length} lessons · {t.lessons.slice(0, 3).map((l) => l.title).join(", ")}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
