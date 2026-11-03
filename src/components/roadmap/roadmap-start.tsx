"use client";

import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { primaryButtonLg } from "@/components/ui";
import { useProgress } from "@/lib/browser/hooks";

/**
 * RM-1: a roadmap's main action. A new learner starts the first lesson; a returning one carries on
 * with the first lesson on this roadmap they have not finished or skipped. Before the browser has
 * read the saved progress it shows the first lesson, so the page never jumps.
 */
export function RoadmapStart({ lessons }: { lessons: { id: string; title: string }[] }) {
  const progress = useProgress();
  if (lessons.length === 0) return null;
  const started = lessons.some((l) => progress.stops[l.id]);
  const next = lessons.find((l) => progress.stops[l.id]?.status !== "done") ?? lessons[0];
  return (
    <div className="flex flex-col gap-1.5">
      <Link href={`/stop/${next.id}`} className={`${primaryButtonLg} self-start`}>
        <Icon name="play" size={18} /> {started ? "Continue learning" : "Start the first lesson"}
      </Link>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {started ? "Next up" : "Lesson 1"}: <span className="font-medium text-zinc-900 dark:text-zinc-100">{next.title}</span>
      </p>
    </div>
  );
}
