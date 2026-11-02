// Roadmaps the learner generated with AI, kept on this device only.
// Every read is checked, because storage can hold anything.
import { z } from "zod";
import { type Roadmap, RoadmapShape } from "@/lib/ai/roadmap";
import { read, write } from "./storage";

export const AI_KEY = "xplaind.ai.v1";
const MAX_ROADMAPS = 12;

export type SavedRoadmap = { id: string; createdOn: string; goal: string; roadmap: Roadmap; done: string[] };
export type SavedAi = { version: 1; roadmaps: SavedRoadmap[] };

const EMPTY: SavedAi = { version: 1, roadmaps: [] };

const SavedRoadmapShape = z.object({
  id: z.string().max(40),
  createdOn: z.string().max(10),
  goal: z.string().max(300),
  roadmap: RoadmapShape,
  done: z.array(z.string().max(40)).max(200),
});

export const rawAi = (): string | null => read(AI_KEY);

export function parseAi(raw: string | null): SavedAi {
  if (!raw) return EMPTY;
  try {
    const v = JSON.parse(raw) as { version?: number; roadmaps?: unknown[] };
    if (!v || v.version !== 1) return EMPTY;
    const keep = <T>(list: unknown[] | undefined, shape: z.ZodType<T>): T[] =>
      (Array.isArray(list) ? list : []).flatMap((x) => {
        const p = shape.safeParse(x);
        return p.success ? [p.data] : [];
      });
    return { version: 1, roadmaps: keep(v.roadmaps, SavedRoadmapShape).slice(0, MAX_ROADMAPS) };
  } catch {
    return EMPTY;
  }
}

const save = (next: SavedAi) => write(AI_KEY, JSON.stringify(next));
const newId = () => Math.random().toString(36).slice(2, 10);

/** Saves a new roadmap first in the list and returns its id. */
export function addRoadmap(goal: string, roadmap: Roadmap, today: string): string {
  const id = newId();
  const cur = parseAi(rawAi());
  save({ ...cur, roadmaps: [{ id, createdOn: today, goal, roadmap, done: [] }, ...cur.roadmaps].slice(0, MAX_ROADMAPS) });
  return id;
}

export function updateRoadmap(id: string, change: (r: SavedRoadmap) => SavedRoadmap): void {
  const cur = parseAi(rawAi());
  save({ ...cur, roadmaps: cur.roadmaps.map((r) => (r.id === id ? change(r) : r)) });
}

export function deleteRoadmap(id: string): void {
  const cur = parseAi(rawAi());
  save({ ...cur, roadmaps: cur.roadmaps.filter((r) => r.id !== id) });
}
