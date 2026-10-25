"use client";

import Link from "next/link";
import { muted } from "@/components/ui";
import { useProgress } from "@/lib/browser/hooks";
import { statusOf } from "@/lib/roadmap/progress";
import type { StopStatus } from "@/lib/roadmap/types";
import type { StopSummary } from "./shared";

const MARK: Record<StopStatus, { icon: string; label: string; className: string }> = {
  done: { icon: "✓", label: "Done", className: "border-emerald-700 bg-emerald-700 text-white" },
  in_progress: { icon: "…", label: "In progress", className: "border-amber-600 text-amber-800 dark:text-amber-300" },
  not_started: { icon: "", label: "Not started", className: "border-zinc-400 dark:border-zinc-600" },
};

/** A level's stops with a tick for each one done (RM-1). Ticks come from this device. */
export function StopList({ stops, showOutcome = false }: { stops: StopSummary[]; showOutcome?: boolean }) {
  const progress = useProgress();
  if (stops.length === 0) return <p className={`text-sm ${muted}`}>The steps for this level are being written.</p>;
  return (
    <ol className="flex flex-col gap-1">
      {stops.map((s) => {
        const status = statusOf(progress.stops, s.id);
        const mark = MARK[status];
        return (
          <li key={s.id}>
            <Link
              href={`/stop/${s.id}`}
              className="flex min-h-12 items-start gap-3 rounded-lg p-2 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-700 dark:hover:bg-zinc-900"
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${mark.className}`}
              >
                {mark.icon}
              </span>
              <span className="flex flex-col">
                <span className="font-medium">{s.title}</span>
                {showOutcome && <span className={`text-sm leading-6 ${muted}`}>{s.outcome}</span>}
                <span className={`text-sm ${muted}`}>
                  {mark.label} · about {s.hours} {s.hours === 1 ? "hour" : "hours"}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
