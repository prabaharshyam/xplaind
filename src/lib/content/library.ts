// RM-10: one tagged list of everything a learner can open: lessons, video lessons and
// skills. Pages filter it by kind, topic, level and channel. Node only.
import type { LevelId } from "@/lib/levels";
import { THEMES, type ThemeId } from "@/lib/themes";
import { getChannels, getGlossary, getResource, getStops, lessonsWithTerm } from "./index";
import { type Embed, youtubeEmbed } from "./media";

export type LibraryKind = "lesson" | "video" | "skill";

export type LibraryItem = {
  kind: LibraryKind;
  /** Unique across kinds. */
  key: string;
  title: string;
  href: string;
  /** One line under the title. */
  summary: string;
  topics: ThemeId[];
  level: LevelId | null;
  /** Skill tags: the glossary terms a lesson teaches, or a video's lesson. */
  tags: string[];
  channel: string | null;
  minutes: number | null;
  embed: Embed | null;
  /** Lessons only: how many video lessons it has. */
  videos: number;
};

export const TOPIC_LABEL: Record<ThemeId, string> = Object.fromEntries(THEMES.map((t) => [t.id, t.label])) as Record<ThemeId, string>;

export function libraryItems(): LibraryItem[] {
  const stops = getStops();
  const glossary = getGlossary();
  const termLabel = new Map(glossary.map((g) => [g.id, g.term]));
  const items: LibraryItem[] = [];

  for (const s of stops) {
    items.push({
      kind: "lesson",
      key: `lesson:${s.id}`,
      title: s.title,
      href: `/stop/${s.id}`,
      summary: s.outcome,
      topics: [s.theme],
      level: s.level,
      tags: s.key_terms.map((t) => termLabel.get(t) ?? t),
      channel: null,
      minutes: s.hours * 60,
      embed: null,
      videos: s.videos.length,
    });
  }

  // Video lessons attached to lessons take that lesson's topic and level.
  const seen = new Set<string>();
  for (const s of stops) {
    for (const id of s.videos) {
      const r = getResource(id);
      const embed = r ? youtubeEmbed(r.url) : null;
      if (!r || !embed || seen.has(embed.id)) continue;
      seen.add(embed.id);
      items.push({
        kind: "video",
        key: `video:${embed.id}`,
        title: r.title,
        href: `/stop/${s.id}`,
        summary: `For the lesson "${s.title}"`,
        topics: [s.theme],
        level: s.level,
        tags: [s.title],
        channel: r.provider,
        minutes: Math.max(1, Math.round(r.hours * 60)),
        embed,
        videos: 0,
      });
    }
  }
  // Featured channels' best videos, tagged with the channel's topics.
  for (const c of getChannels()) {
    for (const v of c.videos) {
      if (seen.has(v.youtube_id)) continue;
      seen.add(v.youtube_id);
      items.push({
        kind: "video",
        key: `video:${v.youtube_id}`,
        title: v.title,
        href: `/videos#${c.id}`,
        summary: `From ${c.name}`,
        topics: c.topics,
        level: null,
        tags: [],
        channel: c.name,
        minutes: v.minutes,
        embed: { kind: "video", id: v.youtube_id },
        videos: 0,
      });
    }
  }

  for (const g of glossary) {
    const lessons = lessonsWithTerm(g.id);
    if (lessons.length === 0) continue;
    items.push({
      kind: "skill",
      key: `skill:${g.id}`,
      title: g.term,
      href: `/glossary#${g.id}`,
      summary: g.definition,
      topics: [...new Set(lessons.map((l) => l.theme))],
      level: null,
      tags: lessons.slice(0, 3).map((l) => l.title),
      channel: null,
      minutes: null,
      embed: null,
      videos: 0,
    });
  }
  return items;
}
