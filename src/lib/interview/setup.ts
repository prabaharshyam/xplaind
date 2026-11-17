// VI-11 (2026-11-17, owner request): what the learner tells us before a mock interview starts, and how
// bank questions are picked from it. Used by the free mock interview and the Pro AI interviewer alike, in
// the browser and on the server. Pure: no network, no database, no React.
import { LEVEL_IDS, type LevelId } from "@/lib/levels";
import { pickQuestions, type SimQuestion } from "./analyse";

/** Years of experience the role asks for, and the question levels that fit each. */
export const EXPERIENCE = [
  { id: "fresher", label: "Student or fresher", short: "a fresher", levels: ["B1", "B2", "B3", "I1"] },
  { id: "junior", label: "1 to 2 years", short: "1 to 2 years of experience", levels: ["B2", "B3", "I1", "I2", "I3"] },
  { id: "mid", label: "3 to 5 years", short: "3 to 5 years of experience", levels: ["I1", "I2", "I3", "P1", "P2"] },
  { id: "senior", label: "6 years or more", short: "6 or more years of experience", levels: ["I3", "P1", "P2", "P3"] },
] as const satisfies readonly { id: string; label: string; short: string; levels: readonly LevelId[] }[];
export type ExperienceId = (typeof EXPERIENCE)[number]["id"];
export const EXPERIENCE_IDS = EXPERIENCE.map((e) => e.id) as [ExperienceId, ...ExperienceId[]];

/** The kind of questions: ideas, real situations, or a mix (as most interviews are). */
export const STYLES = [
  { id: "mixed", label: "A mix", kinds: ["concept", "scenario", "use-case", "real-life"] },
  { id: "concepts", label: "Concepts", kinds: ["concept"] },
  { id: "scenarios", label: "Scenarios and design", kinds: ["scenario", "use-case", "real-life"] },
] as const;
export type StyleId = (typeof STYLES)[number]["id"];
export const STYLE_IDS = STYLES.map((s) => s.id) as [StyleId, ...StyleId[]];

export const experienceOf = (id: string | null | undefined) => EXPERIENCE.find((e) => e.id === id) ?? null;

/** A question as the picker needs it: the simulator's question, with its kind when known. */
export type Pickable = SimQuestion & { kind?: string };

const near = (levels: readonly string[], widen: number): Set<string> => {
  const idx = levels.map((l) => LEVEL_IDS.indexOf(l as LevelId));
  const lo = Math.max(0, Math.min(...idx) - widen);
  const hi = Math.min(LEVEL_IDS.length - 1, Math.max(...idx) + widen);
  return new Set(LEVEL_IDS.slice(lo, hi + 1));
};

/**
 * VI-11: questions for a role, an experience level and a style. Starts with the exact match, then widens
 * (any style, then one level either side, then any level) until there are enough, so a narrow choice
 * still gives a full interview. Spread across topics, as pickQuestions does. Pure and seeded, for tests.
 */
export function pickForSetup(
  all: readonly Pickable[],
  opts: { pathId: string | null; experience: ExperienceId | null; style: StyleId; count: number; seed: number; exclude?: readonly string[] },
): Pickable[] {
  const skip = new Set(opts.exclude ?? []);
  const pool = all.filter((q) => !skip.has(q.id) && (!opts.pathId || q.paths.includes(opts.pathId)));
  const exp = experienceOf(opts.experience);
  const kinds = new Set<string>(STYLES.find((s) => s.id === opts.style)?.kinds ?? STYLES[0].kinds);
  const tiers: ((q: Pickable) => boolean)[] = [];
  const fitsKind = (q: Pickable) => !q.kind || kinds.has(q.kind);
  if (exp) {
    const exact = new Set<string>(exp.levels);
    const wider = near(exp.levels, 1);
    tiers.push((q) => exact.has(q.level) && fitsKind(q), (q) => exact.has(q.level), (q) => wider.has(q.level) && fitsKind(q), (q) => wider.has(q.level));
  } else tiers.push(fitsKind);
  tiers.push(() => true);

  const out: Pickable[] = [];
  const taken = new Set<string>();
  for (const [i, fits] of tiers.entries()) {
    if (out.length >= opts.count) break;
    const left = pool.filter((q) => !taken.has(q.id) && fits(q));
    for (const q of pickQuestions(left, { pathId: null, count: opts.count - out.length, seed: opts.seed + i }) as Pickable[]) {
      taken.add(q.id);
      out.push(q);
    }
  }
  return out;
}
