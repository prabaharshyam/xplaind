// Paths shaped for pages and client islands. Node only (reads content).
import type { LessonSummary, PathRef, PathView } from "@/lib/paths";
import { getPaths, getStop, pathStages } from "./index";
import type { Goal, Stop } from "./schema";

export const lessonSummary = (s: Stop): LessonSummary => ({
  id: s.id,
  title: s.title,
  outcome: s.outcome,
  level: s.level,
  hours: s.hours,
  gap_tags: s.gap_tags,
});

export const pathRef = (p: Goal): PathRef => ({ id: p.id, name: p.name, placement: p.placement });
export const pathRefs = (): PathRef[] => getPaths().map(pathRef);

export function pathView(path: Goal): PathView {
  const stages = pathStages(path).map((st) => ({
    id: st.id,
    title: st.title,
    summary: st.summary,
    lessons: st.lessons.map((id) => lessonSummary(getStop(id)!)),
    planned: st.planned,
    ...(st.project ? { project: st.project } : {}),
  }));
  const lessons = stages.flatMap((st) => st.lessons);
  return {
    ...pathRef(path),
    tagline: path.tagline,
    description: path.description,
    who_for: path.who_for,
    coding: path.coding,
    months: path.months,
    layout: path.layout,
    stages,
    counts: {
      lessons: lessons.length,
      planned: stages.reduce((n, st) => n + st.planned.length, 0),
      hours: lessons.reduce((n, l) => n + l.hours, 0),
    },
  };
}

/** Every path's lessons in path order, keyed by path id, for islands that follow the learner's path. */
export const lessonsByPath = (): Record<string, LessonSummary[]> =>
  Object.fromEntries(getPaths().map((p) => [p.id, pathView(p).stages.flatMap((st) => st.lessons)]));
