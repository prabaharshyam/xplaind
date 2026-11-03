// Shared class names, so buttons and links look, size and focus the same everywhere.
// The brand system is written down in docs/brand.md: violet is the one action colour, every
// button is a pill in one of three sizes, and nothing a finger taps is under 44 px tall.
const core =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 disabled:cursor-not-allowed disabled:opacity-50";

/** Small (44 px): inside cards, toolbars and lists. */
const sm = "min-h-11 px-4 text-sm";
/** Normal (48 px): the default. */
const md = "min-h-12 px-6 py-3";
/** Large (56 px): the one main action of a hero or a page. */
const lg = "min-h-14 px-8 text-lg";

const primary = "bg-violet-700 text-white shadow-md shadow-violet-700/20 hover:bg-violet-800";
const secondary =
  "border border-violet-200 bg-white text-violet-950 hover:border-violet-300 hover:bg-violet-50 dark:border-violet-800 dark:bg-zinc-900 dark:text-violet-100 dark:hover:bg-violet-950";
const quiet = "text-violet-800 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/60";

// MO-5: deep violet for the main action, white with a violet edge for the rest.
export const primaryButton = `${core} ${md} ${primary}`;
export const primaryButtonSm = `${core} ${sm} ${primary}`;
export const primaryButtonLg = `${core} ${lg} ${primary}`;
export const secondaryButton = `${core} ${md} ${secondary}`;
export const secondaryButtonSm = `${core} ${sm} ${secondary}`;
export const secondaryButtonLg = `${core} ${lg} ${secondary}`;
/** A third-level action: text with a hover wash, still 44 px tall. */
export const quietButton = `${core} ${sm} ${quiet}`;

export const textLink = "text-violet-800 underline underline-offset-2 hover:text-violet-950 dark:text-violet-300 dark:hover:text-violet-200";
/** A "See more →" link at the end of a card or section. */
export const arrowLink = "inline-flex min-h-11 items-center gap-1 font-semibold text-violet-800 hover:underline underline-offset-4 dark:text-violet-300";
export const muted = "text-zinc-600 dark:text-zinc-400";
export const card = "rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900";
