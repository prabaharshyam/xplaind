import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { getContent, getStops, getVideoViews } from "@/lib/content";
import { libraryItems } from "@/lib/content/library";
import { resourceEmbed } from "@/lib/content/media";
import { VIDEO_COURSE_TAG } from "@/lib/content/schema";
import { costLabel } from "@/lib/roadmap/cost";
import { THEMES } from "@/lib/themes";
import { type VideoRow, topicCounts } from "@/lib/videos/browse";
import type { CourseRow } from "@/lib/videos/courses";
import { CourseBrowser } from "./course-browser";
import { type TopicChip, VideoBrowser } from "./video-browser";
import { VideoTabs } from "./video-tabs";

export const metadata: Metadata = pageMeta({
  // SE-8: search-led title and description.
  title: ["AI Video Courses: Andrew Ng, DeepLearning.AI and More", "AI Video Courses by Topic"],
  description:
    "AI video courses and lessons by topic: every DeepLearning.AI and Andrew Ng course plus the best YouTube teachers, filtered by level and length.",
  path: "/videos",
});

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
  const chipsFor = (list: { topics: string[] }[]): TopicChip[] =>
    topicCounts(list as VideoRow[]).flatMap(({ topic, count }) => {
      const t = THEMES.find((x) => x.id === topic);
      return t ? [{ id: t.id, label: t.label, count, from: t.from, to: t.to, icon: t.icon }] : [];
    });
  const topics = chipsFor(rows);

  // VD-2: every video course, with the first lesson that lists it.
  const stops = getStops();
  const courses: CourseRow[] = getContent()
    .resources.map((r) => r.data)
    .filter((r) => r.tags.includes(VIDEO_COURSE_TAG))
    .map((r) => {
      const lesson = stops.find((s) => s.primary_resource === r.id || s.alternates.includes(r.id) || s.more.includes(r.id));
      const cost = costLabel(r);
      return {
        id: r.id,
        title: r.title,
        provider: r.provider,
        instructors: r.instructors ?? [],
        topics: r.topics ?? (lesson ? [lesson.theme] : []),
        level: r.level,
        hours: r.hours,
        published: r.published_on ?? null,
        cost: cost.note ? `${cost.label} (${cost.note})` : cost.label,
        embed: resourceEmbed(r),
        notice: r.notice ?? null,
        lesson: lesson ? { id: lesson.id, title: lesson.title } : null,
      };
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
        lead={`${rows.length} hand-picked videos from ${teachers} teachers, and ${courses.length} free video courses, including every DeepLearning.AI course and Andrew Ng's Stanford lectures. Choose a topic, level and length.`}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <VideoTabs
          tabs={[
            { id: "videos", label: "Videos", count: rows.length, panel: <VideoBrowser rows={rows} topics={topics} checkedOn={stats ? fmt(stats.checkedOn) : null} /> },
            { id: "courses", label: "Video courses", count: courses.length, panel: <CourseBrowser rows={courses} topics={chipsFor(courses)} /> },
          ]}
        />
      </div>
    </main>
  );
}
