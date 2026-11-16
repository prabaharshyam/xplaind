import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Cover } from "@/components/art/cover";
import { PageHero } from "@/components/page-hero";
import { getStops } from "@/lib/content";
import { libraryItems, TOPIC_LABEL } from "@/lib/content/library";
import { THEMES } from "@/lib/themes";
import { LibraryBrowser } from "./library-browser";

export const metadata: Metadata = pageMeta({
  // SE-8: search-led title and description.
  title: ["AI Lessons Library: Every Lesson and Video by Topic", "AI Lessons Library"],
  description:
    "Every Xplaind AI lesson, video lesson and AI skill in one place, by topic and level, from AI basics and Python to RAG, agents and MLOps.",
  path: "/library",
});

export default function LibraryPage() {
  const items = libraryItems();
  const channels = [...new Set(items.flatMap((i) => (i.kind === "video" && i.channel ? [i.channel] : [])))].sort((a, b) => a.localeCompare(b));
  const topics = THEMES.map((t) => ({ id: t.id, label: TOPIC_LABEL[t.id] })).filter((t) => items.some((i) => i.topics.includes(t.id)));

  // LY-2: the old Topics page, now the "By topic" view of the Library: one card per subject.
  const stops = getStops();
  const topicCards = THEMES.map((t) => ({ ...t, lessons: stops.filter((s) => s.theme === t.id) })).filter((t) => t.lessons.length > 0);
  const topicGrid = (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {topicCards.map((t) => (
        <li key={t.id}>
          <Link
            href={`/topics/${t.id}`}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <Cover theme={t.id} seed={`topic-${t.id}`} className="h-28" iconSize={36} />
            <span className="p-4">
              <span className="block text-lg font-semibold group-hover:underline">{t.label}</span>
              <span className="mt-1 block text-card text-zinc-600 dark:text-zinc-400">
                {t.lessons.length} lessons · {t.lessons.slice(0, 3).map((l) => l.title).join(", ")}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <main>
      <PageHero shape="magnifier"
        theme="ai-basics"
        seed="library"
        icon="search"
        eyebrow="Library"
        title="Find any lesson, video or skill"
        lead={`${items.filter((i) => i.kind === "lesson").length} lessons, ${items.filter((i) => i.kind === "video").length} video lessons and ${items.filter((i) => i.kind === "skill").length} skills, tagged by topic and level. Search them all, or browse one subject at a time.`}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <Suspense>
          <LibraryBrowser items={items} topics={topics} channels={channels} topicGrid={topicGrid} />
        </Suspense>
      </div>
    </main>
  );
}
