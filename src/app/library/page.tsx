import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/page-hero";
import { libraryItems, TOPIC_LABEL } from "@/lib/content/library";
import { THEMES } from "@/lib/themes";
import { LibraryBrowser } from "./library-browser";

export const metadata: Metadata = {
  title: "Library: lessons, video lessons and skills",
  description: "Every Xplaind lesson, video lesson and AI skill in one place, tagged by topic and level so you can filter to what you need.",
  alternates: { canonical: "/library" },
};

export default function LibraryPage() {
  const items = libraryItems();
  const channels = [...new Set(items.flatMap((i) => (i.kind === "video" && i.channel ? [i.channel] : [])))].sort((a, b) => a.localeCompare(b));
  const topics = THEMES.map((t) => ({ id: t.id, label: TOPIC_LABEL[t.id] })).filter((t) => items.some((i) => i.topics.includes(t.id)));
  return (
    <main>
      <PageHero
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
