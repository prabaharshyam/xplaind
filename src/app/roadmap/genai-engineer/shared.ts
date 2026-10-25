// Types and helpers the roadmap's client islands share with its pages. No Node imports.
import type { LevelId } from "@/lib/levels";

export type StopSummary = { id: string; level: LevelId; order: number; title: string; outcome: string; hours: number; gap_tags: string[] };
export type LevelSummary = { id: LevelId; name: string; can_do: string; exit_check: string; draft_hours: number };

export const levelSlug = (level: LevelId) => level.toLowerCase();
