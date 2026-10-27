// AI roadmap generator and editor: the request, the model's output shape, and the
// clean-up applied before a learner sees it. Pure: no network, no database, no UI.
import { z } from "zod";

export const RoadmapRequest = z.strictObject({
  goal: z.string().trim().min(3).max(300),
  background: z.string().trim().max(600).default(""),
  level: z.enum(["new", "some", "experienced"]),
  hoursPerWeek: z.number().int().min(1).max(40),
  weeks: z.number().int().min(2).max(52),
});
export type RoadmapRequest = z.infer<typeof RoadmapRequest>;

/** What the model must return. Loose on counts; clean() enforces the limits. */
export const ModelRoadmap = z.object({
  title: z.string(),
  summary: z.string(),
  stages: z.array(
    z.object({
      title: z.string(),
      weeks: z.number(),
      goal: z.string(),
      topics: z.array(
        z.object({
          title: z.string(),
          why: z.string(),
          subtopics: z.array(z.string()),
          hours: z.number(),
          lesson_id: z.string().nullable(),
        }),
      ),
    }),
  ),
  project: z.object({ title: z.string(), description: z.string() }),
  tips: z.array(z.string()),
});
export type ModelRoadmap = z.infer<typeof ModelRoadmap>;

export type RoadmapTopic = { id: string; title: string; why: string; subtopics: string[]; hours: number; lessonId: string | null };
export type RoadmapStage = { id: string; title: string; weeks: number; goal: string; topics: RoadmapTopic[] };
export type Roadmap = { title: string; summary: string; stages: RoadmapStage[]; project: { title: string; description: string }; tips: string[] };

/** A roadmap sent back by the browser for editing. Learner-controlled, so bounded. */
const text = (max: number) => z.string().max(max);
export const RoadmapShape: z.ZodType<Roadmap> = z.strictObject({
  title: text(160),
  summary: text(1200),
  stages: z
    .array(
      z.strictObject({
        id: text(40),
        title: text(160),
        weeks: z.number().min(0).max(52),
        goal: text(600),
        topics: z
          .array(
            z.strictObject({
              id: text(40),
              title: text(160),
              why: text(600),
              subtopics: z.array(text(160)).max(10),
              hours: z.number().min(0).max(200),
              lessonId: text(80).nullable(),
            }),
          )
          .max(12),
      }),
    )
    .max(10),
  project: z.strictObject({ title: text(160), description: text(1200) }),
  tips: z.array(text(400)).max(8),
});

export const RefineRequest = z.strictObject({ roadmap: RoadmapShape, instruction: z.string().trim().min(3).max(400) });

const LIMITS = { stages: 8, topics: 10, subtopics: 8, tips: 6 };
const clip = (s: string, n: number) => s.trim().replace(/\s+/g, " ").slice(0, n);
const round = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(Number.isFinite(n) ? n : min)));

/**
 * Makes the model's roadmap safe to show: counts and lengths capped, numbers
 * in range, stable ids, and lesson links kept only when the lesson exists.
 */
export function cleanRoadmap(raw: ModelRoadmap, knownLessons: ReadonlySet<string>): Roadmap {
  const stages = raw.stages
    .slice(0, LIMITS.stages)
    .map((s, i) => ({
      id: `s${i + 1}`,
      title: clip(s.title, 120) || `Stage ${i + 1}`,
      weeks: round(s.weeks, 1, 52),
      goal: clip(s.goal, 400),
      topics: s.topics
        .slice(0, LIMITS.topics)
        .map((t, j) => ({
          id: `s${i + 1}t${j + 1}`,
          title: clip(t.title, 120),
          why: clip(t.why, 400),
          subtopics: t.subtopics.map((x) => clip(x, 120)).filter(Boolean).slice(0, LIMITS.subtopics),
          hours: round(t.hours, 1, 200),
          lessonId: t.lesson_id && knownLessons.has(t.lesson_id) ? t.lesson_id : null,
        }))
        .filter((t) => t.title),
    }))
    .filter((s) => s.topics.length > 0);
  return {
    title: clip(raw.title, 120) || "Your AI learning roadmap",
    summary: clip(raw.summary, 800),
    stages,
    project: { title: clip(raw.project.title, 120), description: clip(raw.project.description, 800) },
    tips: raw.tips.map((t) => clip(t, 300)).filter(Boolean).slice(0, LIMITS.tips),
  };
}

/** Converts a roadmap the learner edited back into the model's shape, for a refine request. */
export function toModelShape(r: Roadmap): ModelRoadmap {
  return {
    title: r.title,
    summary: r.summary,
    stages: r.stages.map((s) => ({
      title: s.title,
      weeks: s.weeks,
      goal: s.goal,
      topics: s.topics.map((t) => ({ title: t.title, why: t.why, subtopics: t.subtopics, hours: t.hours, lesson_id: t.lessonId })),
    })),
    project: r.project,
    tips: r.tips,
  };
}

export const totalHours = (r: Roadmap) => r.stages.reduce((n, s) => n + s.topics.reduce((m, t) => m + t.hours, 0), 0);
export const totalWeeks = (r: Roadmap) => r.stages.reduce((n, s) => n + s.weeks, 0);

// ---------------------------------------------------------------- editing --

/** Moves a topic up (-1) or down (+1) within its stage. Returns a new roadmap. */
export function moveTopic(r: Roadmap, topicId: string, by: -1 | 1): Roadmap {
  return {
    ...r,
    stages: r.stages.map((s) => {
      const i = s.topics.findIndex((t) => t.id === topicId);
      const j = i + by;
      if (i < 0 || j < 0 || j >= s.topics.length) return s;
      const topics = [...s.topics];
      [topics[i], topics[j]] = [topics[j], topics[i]];
      return { ...s, topics };
    }),
  };
}

export function removeTopic(r: Roadmap, topicId: string): Roadmap {
  return { ...r, stages: r.stages.map((s) => ({ ...s, topics: s.topics.filter((t) => t.id !== topicId) })).filter((s) => s.topics.length > 0) };
}

export function renameTopic(r: Roadmap, topicId: string, title: string): Roadmap {
  const clean = clip(title, 120);
  if (!clean) return r;
  return { ...r, stages: r.stages.map((s) => ({ ...s, topics: s.topics.map((t) => (t.id === topicId ? { ...t, title: clean } : t)) })) };
}

/** Adds a topic the learner typed to the end of a stage. */
export function addTopic(r: Roadmap, stageId: string, title: string): Roadmap {
  const clean = clip(title, 120);
  if (!clean) return r;
  return {
    ...r,
    stages: r.stages.map((s) => {
      if (s.id !== stageId || s.topics.length >= 12) return s;
      const used = new Set(s.topics.map((t) => t.id));
      let n = s.topics.length + 1;
      while (used.has(`${s.id}t${n}`)) n++;
      return { ...s, topics: [...s.topics, { id: `${s.id}t${n}`, title: clean, why: "", subtopics: [], hours: 2, lessonId: null }] };
    }),
  };
}
