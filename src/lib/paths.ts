// Which path a learner is on. Pure and safe in client code: no content loading.
import type { ThemeId } from "@/lib/themes";
import { type LevelId, LOWEST_LEVEL } from "@/lib/levels";

export const DEFAULT_PATH_ID = "genai-engineer";

/** What a client island needs to know about a path. */
export type PathRef = { id: string; name: string; placement: "ladder" | "none" };

/**
 * The learner's path: the one they chose, else the one they took the test for,
 * else the default. An id that no longer exists is ignored.
 */
export function currentPathId(known: readonly string[], chosen?: string | null, tested?: string | null): string {
  for (const id of [chosen, tested]) if (id && known.includes(id)) return id;
  return known.includes(DEFAULT_PATH_ID) ? DEFAULT_PATH_ID : (known[0] ?? DEFAULT_PATH_ID);
}

/** Where the test-based skip starts on a path. A path with no test skips nothing. */
export function startFor(path: Pick<PathRef, "placement">, tested: LevelId | null | undefined): LevelId {
  return path.placement === "ladder" && tested ? tested : LOWEST_LEVEL;
}

/** Where "Find my level" goes for a path. */
export const testHref = (pathId: string): string => (pathId === DEFAULT_PATH_ID ? "/start" : `/start/${pathId}`);
export const roadmapHref = (pathId: string): string => `/roadmap/${pathId}`;

/** A lesson as a path's map shows it. */
export type LessonSummary = {
  id: string;
  title: string;
  outcome: string;
  level: LevelId;
  hours: number;
  gap_tags: string[];
  /** Visual theme (icon and colours). */
  theme?: ThemeId;
};

export type StageView = {
  id: string;
  title: string;
  summary: string;
  lessons: LessonSummary[];
  planned: { title: string; summary: string }[];
  project?: { title: string; brief: string; deliverables: string[] };
};

export type PathView = PathRef & {
  tagline: string;
  description: string;
  who_for: string;
  coding: "none" | "some" | "yes";
  months: number;
  layout: "levels" | "stages";
  theme?: ThemeId;
  stages: StageView[];
  /** Written lessons, topics still being written, and hours of written lessons. */
  counts: { lessons: number; planned: number; hours: number };
};

export const CODING_LABEL = { none: "No coding", some: "Light code", yes: "Python" } as const;
