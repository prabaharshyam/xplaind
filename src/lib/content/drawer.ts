// What a roadmap's topic drawer shows for each lesson. Node only (reads content).
import { costLabel } from "@/lib/roadmap/cost";
import type { ThemeId } from "@/lib/themes";
import { getGlossary, getResource, getStop } from "./index";
import { getInterviewViews } from "./interview";
import { type Embed, kindLabel, youtubeEmbed } from "./media";

export type DrawerCourse = {
  id: string;
  title: string;
  provider: string;
  type: string;
  cost: string;
  hours: number;
  certificate: boolean;
  pick: "best" | "also";
  kindLabel: string;
  embed: Embed | null;
  notice: string | null;
};

export type TopicDetail = {
  id: string;
  title: string;
  outcome: string;
  why: string;
  hours: number;
  level: string;
  theme: ThemeId;
  terms: string[];
  questions: number;
  courses: DrawerCourse[];
};

export function topicDetails(lessonIds: readonly string[]): Record<string, TopicDetail> {
  const glossary = new Map(getGlossary().map((g) => [g.id, g.term]));
  const questions = getInterviewViews();
  const out: Record<string, TopicDetail> = {};
  for (const id of lessonIds) {
    const s = getStop(id);
    if (!s) continue;
    const ids = [...s.videos, s.primary_resource, ...s.alternates, ...s.more];
    out[id] = {
      id,
      title: s.title,
      outcome: s.outcome,
      why: s.why_it_matters,
      hours: s.hours,
      level: s.level,
      theme: s.theme,
      terms: s.key_terms.map((t) => glossary.get(t) ?? t).slice(0, 6),
      questions: questions.filter((q) => q.stop.id === id).length,
      courses: ids.map((rid) => {
        const r = getResource(rid)!;
        const c = costLabel(r);
        return {
          id: r.id,
          title: r.title,
          provider: r.provider,
          type: r.type,
          cost: c.note ? `${c.label} (${c.note})` : c.label,
          hours: r.hours,
          certificate: r.certificate,
          pick: rid === s.primary_resource ? "best" : "also",
          kindLabel: kindLabel(r),
          embed: youtubeEmbed(r.url),
          notice: r.notice ?? null,
        };
      }),
    };
  }
  return out;
}
