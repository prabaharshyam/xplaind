import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { getVideoViews } from "@/lib/content";
import { libraryItems } from "@/lib/content/library";
import { THEMES } from "@/lib/themes";
import { type VideoRow, topicCounts } from "@/lib/videos/browse";
import { type TopicChip, VideoBrowser } from "./video-browser";

export const metadata: Metadata = {
  title: "AI video lessons by topic: hand-picked from the best teachers on YouTube",
  description: "Filter hand-picked AI video lessons by topic, level and length, see how many people watched each, and play them right here on Xplaind.",
  alternates: { canonical: "/videos" },
};

const fmt = (iso: string) => new Date(`${iso}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

/** VD-1: all video lessons in one list, filtered by topic, level and length, with public view counts. They play on the page (RM-4). */
export default function VideosPage() {
  const stats = getVideoViews();
  const rows: VideoRow[] = libraryItems()
    .filter((i) => i.kind === "video" && i.embed?.kind === "video")
    .map((i) => ({
      id: i.embed!.id,
      title: i.title,
      channel: i.channel,
      topics: i.topics,
      level: i.level,
      minutes: i.minutes ?? 0,
      views: stats?.views[i.embed!.id] ?? null,
      lesson: i.href.startsWith("/stop/") && i.tags[0] ? { id: i.href.slice("/stop/".length), title: i.tags[0] } : null,
    }));
  const teachers = new Set(rows.map((r) => r.channel).filter(Boolean)).size;
  const topics: TopicChip[] = topicCounts(rows).flatMap(({ topic, count }) => {
    const t = THEMES.find((x) => x.id === topic);
    return t ? [{ id: t.id, label: t.label, count, from: t.from, to: t.to, icon: t.icon }] : [];
  });

  return (
    <main>
      <PageHero
        shape="screenPlay"
        theme="using-ai"
        seed="videos"
        icon="play"
        eyebrow="Video lessons"
        title="AI video lessons, by topic"
        lead={`${rows.length} hand-picked videos from ${teachers} teachers. Choose a topic, level and length, and press Watch to play one on this page, so you never lose your place.`}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <VideoBrowser rows={rows} topics={topics} checkedOn={stats ? fmt(stats.checkedOn) : null} />
      </div>
    </main>
  );
}
