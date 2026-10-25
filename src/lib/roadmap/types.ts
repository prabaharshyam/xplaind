// Types for the roadmap engine. Pure data: no database, UI or framework imports.
import type { LevelId } from "@/lib/levels";

/** The least a stop needs for ordering and progress. */
export type RoadmapStop = {
  id: string;
  level: LevelId;
  hours: number;
  gap_tags: readonly string[];
};

/** RM-7 and RM-8. Mirrors the stop_progress table, so slice S5 can claim it as is. */
export type DoneHow = "check" | "project" | "self_skipped";
export type StopStatus = "not_started" | "in_progress" | "done";

export type StopProgress = {
  status: Exclude<StopStatus, "not_started">;
  how?: DoneHow;
  /** Percent correct on the stop's check, 0 to 100. */
  score?: number;
  projectUrl?: string;
  /** YYYY-MM-DD in India. */
  updatedOn: string;
};

export type ProgressMap = Readonly<Record<string, StopProgress>>;

/** One item of the next-five-steps card (RM-3). */
export type NextStep = { stopId: string; reason: "review"; gapTag: string } | { stopId: string; reason: "next" };
