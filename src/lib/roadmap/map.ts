// The roadmap map (RM-1): every level's topics, each paired with the stop that
// teaches it, if one is written yet. Pure.
import type { LevelId } from "@/lib/levels";
import { byLadder } from "./next-steps";
import type { RoadmapStop } from "./types";

export type MapTopic = { id: string; title: string; summary: string; optional: boolean; stopId: string | null };

/** The first stop, in ladder order, at the topic's own level that lists the topic. */
export function topicsWithStops(
  level: LevelId,
  topics: readonly { id: string; title: string; summary: string; optional: boolean }[],
  stops: readonly RoadmapStop[],
): MapTopic[] {
  const here = stops.filter((s) => s.level === level).sort(byLadder);
  return topics.map((t) => ({ ...t, stopId: here.find((s) => s.gap_tags.includes(t.id))?.id ?? null }));
}

/** B, I and P: the three lines of the map. */
export type Stage = "beginner" | "intermediate" | "pro";

export function stageOf(level: LevelId): Stage {
  return level.startsWith("B") ? "beginner" : level.startsWith("I") ? "intermediate" : "pro";
}
