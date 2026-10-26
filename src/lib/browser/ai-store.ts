// Roadmaps and courses the learner generated with AI, kept on this device only.
// Every read is checked, because storage can hold anything.
import { z } from "zod";
import { type CourseLesson, type CourseOutline } from "@/lib/ai/features";
import { type Roadmap, RoadmapShape } from "@/lib/ai/roadmap";
import { read, write } from "./storage";

export const AI_KEY = "xplaind.ai.v1";
const MAX_ROADMAPS = 12;
const MAX_COURSES = 12;

export type SavedRoadmap = { id: string; createdOn: string; goal: string; roadmap: Roadmap; done: string[] };
export type SavedCourse = { id: string; createdOn: string; level: "new" | "some" | "experienced"; outline: CourseOutline; lessons: Record<string, CourseLesson> };
export type SavedAi = { version: 1; roadmaps: SavedRoadmap[]; courses: SavedCourse[] };

const EMPTY: SavedAi = { version: 1, roadmaps: [], courses: [] };

const SavedRoadmapShape = z.object({
  id: z.string().max(40),
  createdOn: z.string().max(10),
  goal: z.string().max(300),
  roadmap: RoadmapShape,
  done: z.array(z.string().max(40)).max(200),
});

const Lesson = z.object({
  title: z.string(),
  intro: z.string(),
  sections: z.array(z.object({ heading: z.string(), body: z.string() })),
  diagram: z.string(),
  example: z.object({ title: z.string(), body: z.string() }),
  key_points: z.array(z.string()),
  quiz: z.array(z.object({ question: z.string(), options: z.array(z.string()), answer_index: z.number(), explanation: z.string() })),
  flashcards: z.array(z.object({ q: z.string(), a: z.string() })),
});
const SavedCourseShape = z.object({
  id: z.string().max(40),
  createdOn: z.string().max(10),
  level: z.enum(["new", "some", "experienced"]),
  outline: z.object({
    title: z.string(),
    summary: z.string(),
    audience: z.string(),
    modules: z.array(z.object({ title: z.string(), summary: z.string(), lessons: z.array(z.object({ title: z.string(), summary: z.string() })) })),
  }),
  lessons: z.record(z.string(), Lesson),
});

export const rawAi = (): string | null => read(AI_KEY);

export function parseAi(raw: string | null): SavedAi {
  if (!raw) return EMPTY;
  try {
    const v = JSON.parse(raw) as { version?: number; roadmaps?: unknown[]; courses?: unknown[] };
    if (!v || v.version !== 1) return EMPTY;
    const keep = <T>(list: unknown[] | undefined, shape: z.ZodType<T>): T[] =>
      (Array.isArray(list) ? list : []).flatMap((x) => {
        const p = shape.safeParse(x);
        return p.success ? [p.data] : [];
      });
    return { version: 1, roadmaps: keep(v.roadmaps, SavedRoadmapShape).slice(0, MAX_ROADMAPS), courses: keep(v.courses, SavedCourseShape).slice(0, MAX_COURSES) };
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

export function addCourse(level: SavedCourse["level"], outline: CourseOutline, today: string): string {
  const id = newId();
  const cur = parseAi(rawAi());
  save({ ...cur, courses: [{ id, createdOn: today, level, outline, lessons: {} }, ...cur.courses].slice(0, MAX_COURSES) });
  return id;
}

export function saveCourseLesson(courseId: string, key: string, lesson: CourseLesson): void {
  const cur = parseAi(rawAi());
  save({ ...cur, courses: cur.courses.map((c) => (c.id === courseId ? { ...c, lessons: { ...c.lessons, [key]: lesson } } : c)) });
}

export function deleteCourse(id: string): void {
  const cur = parseAi(rawAi());
  save({ ...cur, courses: cur.courses.filter((c) => c.id !== id) });
}
