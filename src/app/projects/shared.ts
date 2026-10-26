export const DIFFICULTY_LABEL = { starter: "Starter", intermediate: "Intermediate", advanced: "Advanced" } as const;
export type Difficulty = keyof typeof DIFFICULTY_LABEL;
