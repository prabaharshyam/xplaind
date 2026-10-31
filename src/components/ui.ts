// Shared class names, so buttons and links look and focus the same everywhere.
const base =
  "inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 font-medium transition active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 disabled:cursor-not-allowed disabled:opacity-50";

// MO-5: the pastel brand's buttons: deep violet for the main action, a soft lilac for the rest.
export const primaryButton = `${base} bg-violet-700 text-white shadow-md shadow-violet-700/20 hover:bg-violet-800`;
export const secondaryButton = `${base} border border-violet-200 bg-white/70 text-violet-950 backdrop-blur hover:bg-violet-50 dark:border-violet-800 dark:bg-white/5 dark:text-violet-100 dark:hover:bg-violet-950`;
export const textLink = "text-violet-800 underline underline-offset-2 dark:text-violet-300";
export const muted = "text-zinc-600 dark:text-zinc-400";
export const card = "rounded-lg border border-zinc-200 p-4 dark:border-zinc-800";
