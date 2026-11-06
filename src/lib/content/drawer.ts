// What a roadmap's topic drawer shows for each lesson. Node only (reads content).
import { costLabel } from "@/lib/roadmap/cost";
import type { ThemeId } from "@/lib/themes";
import { getGlossary, getResource, getStop } from "./index";
import { getInterviewViews } from "./interview";
import { kindLabel } from "./media";

export type DrawerCourse = {
  id: string;
  title: string;
  provider: string;
  type: string;
  cost: string;
  hours: number;
  certificate: boolean;
  pick: "best" | "also";
  /** RM-13: free to learn (free, or free with a paid certificate). Paid ones are listed apart. */
  free: boolean;
  kindLabel: string;
  notice: string | null;
};

export type TopicDetail = {
  id: string;
  title: string;
  /** RM-13: the lesson's plain one-line answer, shown as "What it is". */
  what: string;
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
    // RM-13 (2026-11-06): videos are kept for the lesson page; the panel lists courses and reading.
    const ids = [s.primary_resource, ...s.alternates, ...s.more].filter((rid) => getResource(rid)?.type !== "video");
    out[id] = {
      id,
      title: s.title,
      what: s.answer,
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
          free: r.cost !== "paid",
          kindLabel: kindLabel(r),
          notice: r.notice ?? null,
        };
      }),
    };
  }
  return out;
}
