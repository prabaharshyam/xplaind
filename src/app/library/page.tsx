import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/page-hero";
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
  return (
    <main>
      <PageHero shape="magnifier"
        theme="ai-basics"
        seed="library"
        icon="search"
        eyebrow="Library"
        title="Find any lesson, video or skill"
        lead={`${items.filter((i) => i.kind === "lesson").length} lessons, ${items.filter((i) => i.kind === "video").length} video lessons and ${items.filter((i) => i.kind === "skill").length} skills, tagged by topic and level.`}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <Suspense>
          <LibraryBrowser items={items} topics={topics} channels={channels} />
        </Suspense>
      </div>
    </main>
  );
}
