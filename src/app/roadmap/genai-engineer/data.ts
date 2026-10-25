// What the roadmap pages pass to their client islands. Node only.
import { getContent, getStopsInOrder } from "@/lib/content";
import type { LevelSummary, StopSummary } from "./shared";

export { levelSlug } from "./shared";

export const GOAL_ID = "genai-engineer";

export function roadmapData(): { goal: { id: string; name: string }; levels: LevelSummary[]; stops: StopSummary[] } {
  const content = getContent();
  const goal = content.goals.find((g) => g.data.id === GOAL_ID)!.data;
  return {
    goal: { id: goal.id, name: goal.name },
    levels: content.levels.map(({ data: l }) => ({ id: l.id, name: l.name, can_do: l.can_do, exit_check: l.exit_check, draft_hours: l.draft_hours })),
    stops: getStopsInOrder().map((s) => ({
      id: s.id,
      level: s.level,
      order: s.order,
      title: s.title,
      outcome: s.outcome,
      hours: s.hours,
      gap_tags: s.gap_tags,
    })),
  };
}
