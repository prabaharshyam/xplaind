// Shared class names, so buttons and links look and focus the same everywhere.
const base =
  "inline-flex min-h-12 items-center justify-center rounded-lg px-5 py-3 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50";

export const primaryButton = `${base} bg-emerald-700 text-white hover:bg-emerald-800`;
export const secondaryButton = `${base} border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900`;
export const textLink = "text-emerald-800 underline underline-offset-2 dark:text-emerald-400";
export const muted = "text-zinc-600 dark:text-zinc-400";
export const card = "rounded-lg border border-zinc-200 p-4 dark:border-zinc-800";
