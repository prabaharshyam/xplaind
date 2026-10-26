// One shape for every roadmap, whether a path is laid out by level or by stage.
// Pure data, shared by the roadmap page and its client islands.
import type { LevelId } from "@/lib/levels";
import type { ThemeId } from "@/lib/themes";

export type RoadmapTopic = {
  /** Unique within the roadmap. */
  key: string;
  title: string;
  summary: string;
  /** The lesson that teaches it, or null while it is still being written. */
  stopId: string | null;
  optional: boolean;
  level: LevelId | null;
  hours: number | null;
  theme: ThemeId | null;
};

export type RoadmapProject = { title: string; brief: string; deliverables: string[] };

export type RoadmapSection = {
  id: string;
  /** Short marker on the spine: a level id such as "B2", or the stage number. */
  code: string;
  title: string;
  summary: string;
  /** A page with more about this section, if there is one. */
  href: string | null;
  topics: RoadmapTopic[];
  project: RoadmapProject | null;
};

export type RoadmapModel = {
  pathId: string;
  name: string;
  placement: "ladder" | "none";
  sections: RoadmapSection[];
};

/** Written lessons in roadmap order, without repeats. */
export const roadmapStopIds = (m: RoadmapModel): string[] => [
  ...new Set(m.sections.flatMap((s) => s.topics.flatMap((t) => (t.stopId ? [t.stopId] : [])))),
];

/** Key for a section's project in the learner's saved progress. */
export const projectKey = (pathId: string, sectionId: string): string => `${pathId}/${sectionId}`;
