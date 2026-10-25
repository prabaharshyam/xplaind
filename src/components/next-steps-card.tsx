"use client";

import Link from "next/link";
import { useProgress } from "@/lib/browser/hooks";
import type { LevelId } from "@/lib/levels";
import { nextSteps } from "@/lib/roadmap/next-steps";
import { completedIds } from "@/lib/roadmap/progress";
import type { RoadmapStop } from "@/lib/roadmap/types";
import { tagLabel } from "@/lib/text";
import { muted, textLink } from "./ui";

type Stop = RoadmapStop & { title: string };

/** RM-3. Shown on the result page now; the dashboard and weekly email reuse nextSteps(). */
export function NextStepsCard({ stops, startLevel, gapTags }: { stops: Stop[]; startLevel: LevelId; gapTags: string[] }) {
  const progress = useProgress();
  const steps = nextSteps({ stops, startLevel, gapTags, completed: completedIds(progress.stops) });
  const byId = new Map(stops.map((s) => [s.id, s]));

  return (
    <section aria-labelledby="next-heading" className="flex flex-col gap-3">
      <h2 id="next-heading" className="text-xl font-semibold">
        Your next five steps
      </h2>
      {steps.length === 0 ? (
        <p className="leading-7">
          The steps from {startLevel} up are still being written. Meanwhile, browse{" "}
          <Link href="/roadmap/genai-engineer" className={textLink}>
            the whole roadmap
          </Link>
          .
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {steps.map((step, n) => {
            const s = byId.get(step.stopId)!;
            return (
              <li key={s.id}>
                <Link
                  href={`/stop/${s.id}`}
                  className="flex min-h-12 gap-3 rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-emerald-700 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  <span aria-hidden="true" className="font-semibold text-emerald-800 dark:text-emerald-400">
                    {n + 1}
                  </span>
                  <span className="flex flex-col">
                    <span className="font-medium">{s.title}</span>
                    <span className={`text-sm ${muted}`}>
                      {step.reason === "review" ? `Review for ${tagLabel(step.gapTag)} · ` : `${s.level} · `}
                      about {s.hours} {s.hours === 1 ? "hour" : "hours"}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
      {steps.length > 0 && steps.length < 5 && (
        <p className={`text-sm ${muted}`}>More steps are being written for the levels above.</p>
      )}
      <Link href="/roadmap/genai-engineer" className={textLink}>
        See the whole roadmap
      </Link>
    </section>
  );
}
