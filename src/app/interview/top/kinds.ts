import type { InterviewKind } from "@/lib/interview/types";

export const KIND_LABEL: Record<InterviewKind, string> = {
  concept: "Concept",
  scenario: "Scenario",
  "use-case": "Use case",
  "real-life": "Real life",
};

/** Literal classes so Tailwind keeps them. */
export const KIND_STYLE: Record<InterviewKind, string> = {
  concept: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  scenario: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  "use-case": "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  "real-life": "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
};
