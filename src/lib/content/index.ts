// The only way pages read editorial content (ED-8: content reaches the site only
// through the build). Loads once per process and throws if anything is invalid,
// so a bad file fails `next build` instead of reaching a visitor.
import path from "node:path";
import { todayInIST } from "@/lib/dates";
import { LEVEL_IDS, type LevelId } from "@/lib/levels";
import { loadContent } from "./load";
import type { Bundle } from "./types";
import { validateBundle } from "./validate";
import type { LevelDefinition, Resource, Stop } from "./schema";

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

/** Stops in ladder order: by level, then by order within the level. */
export function getStopsInOrder(): Stop[] {
  return [...getStops()].sort(
    (a, b) => LEVEL_IDS.indexOf(a.level) - LEVEL_IDS.indexOf(b.level) || a.order - b.order,
  );
}
