// UX-13 (2026-11-27, owner: StudyFetch's design language, "start with Part 1"): every tool has one soft colour of its
// own, used on its icon tile, its product frame and its tile in "Explore more tools". Only the brand's colour
// families (BR-1): teal (brand), sky, emerald, amber and rose. Colour sits behind icons and product frames,
// never behind reading text (docs/brand.md).
export type Tone = "teal" | "sky" | "emerald" | "amber" | "rose";

/** A small icon tile: a soft tint with the icon in the same family's ink. */
export const TILE: Record<Tone, string> = {
  teal: "bg-brand-100 text-brand-900 dark:bg-brand-900/60 dark:text-brand-200",
  sky: "bg-sky-100 text-sky-900 dark:bg-sky-950/70 dark:text-sky-200",
  emerald: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200",
  amber: "bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200",
  rose: "bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-200",
};

/** A large colour field behind a product frame (UX-14). */
export const FIELD: Record<Tone, string> = {
  teal: "bg-brand-100 dark:bg-brand-900/50",
  sky: "bg-sky-100 dark:bg-sky-950/60",
  emerald: "bg-emerald-100 dark:bg-emerald-950/60",
  amber: "bg-amber-100 dark:bg-amber-950/60",
  rose: "bg-rose-100 dark:bg-rose-950/60",
};
