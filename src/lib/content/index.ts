// The only way pages read editorial content (ED-8: content reaches the site only
// through the build). Loads once per process and throws if anything is invalid,
// so a bad file fails `next build` instead of reaching a visitor.
import path from "node:path";
import { todayInIST } from "@/lib/dates";
import type { LevelId } from "@/lib/levels";
import { loadContent } from "./load";
import type { Bundle } from "./types";
import { validateBundle } from "./validate";
import type { BlogPost, Certification, Goal, GlossaryTerm, LevelDefinition, PathStage, Resource, Stop, StageProject } from "./schema";

let cached: Bundle | undefined;

export function getContent(): Bundle {
  if (cached) return cached;
  const root = path.join(/* turbopackIgnore: true */ process.cwd(), "content");
  const { bundle, issues } = loadContent(root);
  const launch = process.env.CONTENT_LAUNCH === "1";
  const all = [...issues, ...validateBundle(bundle, { today: todayInIST(), launch })];
  const errors = all.filter((i) => i.severity === "error");
  if (errors.length) {
    const lines = errors.map((e) => `  ${e.file}: ${e.message}`).join("\n");
    throw new Error(`Content is invalid (run "npm run content:validate"):\n${lines}`);
  }
  cached = bundle;
  return bundle;
}

export const getStops = (): Stop[] => getContent().stops.map((s) => s.data);
export const getStop = (id: string): Stop | undefined => getStops().find((s) => s.id === id);
export const getResource = (id: string): Resource | undefined =>
  getContent().resources.find((r) => r.data.id === id)?.data;
export const getLevel = (id: LevelId): LevelDefinition | undefined =>
  getContent().levels.find((l) => l.data.id === id)?.data;

export const GENAI_PATH_ID = "genai-engineer";

/** Paths in the order the chooser shows them. */
export const getPaths = (): Goal[] => getContent().goals.map((g) => g.data).sort((a, b) => a.rank - b.rank);
export const getPath = (id: string): Goal | undefined => getPaths().find((g) => g.id === id);

/** A stage with its name filled in from levels.yaml on a path laid out by level. */
export type ResolvedStage = Omit<PathStage, "title" | "summary"> & { title: string; summary: string; project?: StageProject };

export function pathStages(path: Goal): ResolvedStage[] {
  return path.stages.map((st) => {
    const level = path.layout === "levels" ? getLevel(st.id as LevelId) : undefined;
    return { ...st, title: st.title ?? level?.name ?? st.id, summary: st.summary ?? level?.can_do ?? "" };
  });
}

/** Every lesson on a path, in the order a learner takes them. */
export function pathLessons(pathId: string): Stop[] {
  const path = getPath(pathId);
  if (!path) return [];
  const byId = new Map(getStops().map((s) => [s.id, s]));
  return path.stages.flatMap((st) => st.lessons.map((id) => byId.get(id)!));
}

/** The paths a lesson sits on, in chooser order. */
export const pathsWithLesson = (lessonId: string): Goal[] =>
  getPaths().filter((p) => p.stages.some((st) => st.lessons.includes(lessonId)));

/** The GenAI Engineer path's lessons, in ladder order. */
export const getStopsInOrder = (): Stop[] => pathLessons(GENAI_PATH_ID);

/** Glossary terms, A to Z. */
export const getGlossary = (): GlossaryTerm[] =>
  getContent()
    .glossary.map((g) => g.data)
    .sort((a, b) => a.term.localeCompare(b.term, "en", { sensitivity: "base" }));

/** Lessons that list a term among their key terms, in library order. */
export const lessonsWithTerm = (termId: string): Stop[] => getStops().filter((s) => s.key_terms.includes(termId));

/** Certifications, entry level first, then by provider. */
export const getCertifications = (): Certification[] =>
  getContent()
    .certifications.map((c) => c.data)
    .sort((a, b) => a.level.localeCompare(b.level) || a.provider.localeCompare(b.provider));

/** Blog posts, newest first. */
export const getBlogPosts = (): BlogPost[] =>
  getContent()
    .blog.map((b) => b.data)
    .sort((a, b) => b.published_on.localeCompare(a.published_on) || a.title.localeCompare(b.title));
export const getBlogPost = (id: string): BlogPost | undefined => getBlogPosts().find((b) => b.id === id);
