// Builds the shared roadmap model from a path. Node only (reads content).
import { type LevelId, isLevelId } from "@/lib/levels";
import { roadmapHref } from "@/lib/paths";
import { topicsWithStops } from "@/lib/roadmap/map";
import type { RoadmapModel, RoadmapSection, RoadmapTopic } from "@/lib/roadmap/view";
import { getLevel, getStopsInOrder } from "./index";
import { pathView } from "./paths";
import type { Goal } from "./schema";

export function roadmapModel(path: Goal): RoadmapModel {
  const view = pathView(path);
  const byLevel = path.layout === "levels";
  const ladder = byLevel ? getStopsInOrder() : [];
  const sections: RoadmapSection[] = view.stages.map((st, i) => {
    const lessons: RoadmapTopic[] = st.lessons.map((l) => ({
      key: l.id,
      title: l.title,
      summary: l.outcome,
      stopId: l.id,
      optional: false,
      level: l.level,
      hours: l.hours,
      theme: l.theme ?? null,
    }));
    const level = byLevel && isLevelId(st.id) ? getLevel(st.id as LevelId) : undefined;
    // Level topics with no lesson yet show as "coming soon"; topics a lesson covers are already listed.
    const unwritten: RoadmapTopic[] = level
      ? topicsWithStops(level.id, level.topics, ladder)
          .filter((t) => t.stopId === null)
          .map((t) => ({ key: `${st.id}:${t.id}`, title: t.title, summary: t.summary, stopId: null, optional: t.optional, level: level.id, hours: null, theme: null }))
      : st.planned.map((t, j) => ({ key: `${st.id}:planned-${j}`, title: t.title, summary: t.summary, stopId: null, optional: false, level: null, hours: null, theme: null }));
    const project = st.project ?? (level ? { title: `${level.id} ${level.name} project`, brief: `${level.exit_check}.`, deliverables: [] } : null);
    return {
      id: st.id,
      code: level ? level.id : String(i + 1),
      title: level ? `${level.id} ${level.name}` : st.title,
      summary: st.summary,
      href: level ? `${roadmapHref(path.id)}/${level.id.toLowerCase()}` : null,
      topics: [...lessons, ...unwritten],
      project,
    };
  });
  return { pathId: path.id, name: view.name, placement: view.placement, sections };
}
