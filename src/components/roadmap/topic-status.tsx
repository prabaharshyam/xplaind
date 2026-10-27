"use client";

import { Icon } from "@/components/art/icons";
import { useProgress, useToday } from "@/lib/browser/hooks";
import { clearStop, setStop } from "@/lib/browser/progress-store";
import { todayInIST } from "@/lib/dates";
import { type TopicState, recordFor, topicStateOf } from "@/lib/roadmap/progress";
import type { StopProgress } from "@/lib/roadmap/types";

/** Literal class names per state, so Tailwind keeps them. Shared by the map, the drawer and the lesson page. */
export const STATE_STYLE: Record<TopicState, { label: string; on: string; card: string; dot: string }> = {
  todo: {
    label: "To do",
    on: "border-zinc-700 bg-zinc-800 text-white dark:border-zinc-200 dark:bg-zinc-100 dark:text-zinc-900",
    card: "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900",
    dot: "border-zinc-400 bg-white dark:bg-zinc-900",
  },
  learning: {
    label: "Learning",
    on: "border-amber-500 bg-amber-400 text-amber-950",
    card: "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/40",
    dot: "border-amber-500 bg-amber-400",
  },
  done: {
    label: "Done",
    on: "border-emerald-700 bg-emerald-700 text-white",
    card: "border-emerald-500 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40",
    dot: "border-emerald-600 bg-emerald-600",
  },
  skipped: {
    label: "Skipped",
    on: "border-zinc-500 bg-zinc-500 text-white",
    card: "border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/60",
    dot: "border-zinc-400 bg-zinc-400",
  },
};

const CHOICES: { state: Exclude<TopicState, "todo">; label: string; icon: "play" | "tick" | "skip" }[] = [
  { state: "learning", label: "Learning", icon: "play" },
  { state: "done", label: "Done", icon: "tick" },
  { state: "skipped", label: "Skip", icon: "skip" },
];

/** The learner's state for one topic, kept on this device and synced when signed in. */
export function useTopicState(stopId: string): [TopicState, (next: TopicState) => void] {
  const progress = useProgress();
  const today = useToday();
  const state = topicStateOf(progress.stops, stopId);
  const set = (next: TopicState) => {
    const record = recordFor(progress.stops[stopId] as StopProgress | undefined, next, today ?? todayInIST());
    if (record) setStop(stopId, record);
    else clearStop(stopId);
  };
  return [state, set];
}

/**
 * Learning, Done and Skip, as on roadmap.sh. Tapping the active choice again puts the
 * topic back to "to do". Done is a self-report (RM-7 as amended); Skip means "I already
 * know this" (RM-8).
 */
export function TopicStatus({ stopId, title, size = "md", label }: { stopId: string; title: string; size?: "sm" | "md"; label?: string }) {
  const [state, set] = useTopicState(stopId);
  const pad = size === "sm" ? "min-h-9 px-2.5 text-xs" : "min-h-10 px-3 text-sm";
  return (
    <div role="group" aria-label={label ?? `Your status for ${title}`} className="flex flex-wrap gap-1.5">
      {CHOICES.map((c) => {
        const active = state === c.state;
        return (
          <button
            key={c.state}
            type="button"
            aria-pressed={active}
            onClick={() => set(active ? "todo" : c.state)}
            className={`flex items-center gap-1.5 rounded-full border font-medium transition ${pad} ${
              active ? STATE_STYLE[c.state].on : "border-zinc-300 bg-white hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            }`}
          >
            <Icon name={c.icon} size={size === "sm" ? 13 : 15} /> {c.label}
          </button>
        );
      })}
    </div>
  );
}
