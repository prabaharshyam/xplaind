// The nine-level ladder (PRD: Placement test and levels). Shared by content
// schemas and the placement module. No other imports, so it is safe anywhere.

export const LEVEL_IDS = ["B1", "B2", "B3", "I1", "I2", "I3", "P1", "P2", "P3"] as const;

export type LevelId = (typeof LEVEL_IDS)[number];

export const LOWEST_LEVEL: LevelId = LEVEL_IDS[0];
export const HIGHEST_LEVEL: LevelId = LEVEL_IDS[LEVEL_IDS.length - 1];

export function isLevelId(value: unknown): value is LevelId {
  return typeof value === "string" && (LEVEL_IDS as readonly string[]).includes(value);
}

/** 0 for B1 up to 8 for P3. */
export function levelIndex(level: LevelId): number {
  return LEVEL_IDS.indexOf(level);
}

/** One level up, stopping at P3. */
export function levelUp(level: LevelId): LevelId {
  return LEVEL_IDS[Math.min(levelIndex(level) + 1, LEVEL_IDS.length - 1)];
}

/** One level down, stopping at B1. */
export function levelDown(level: LevelId): LevelId {
  return LEVEL_IDS[Math.max(levelIndex(level) - 1, 0)];
}
