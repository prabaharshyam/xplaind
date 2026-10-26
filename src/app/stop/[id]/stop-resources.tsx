"use client";

import { ResourceCard, type ResourceCardData } from "@/components/resource-card";
import { useProgress, useToday } from "@/lib/browser/hooks";
import { setFreeOnly, setStop } from "@/lib/browser/progress-store";
import { orderResources } from "@/lib/roadmap/resources";

/** RM-2 and RM-9: the stop's resources, primary first, with the "Free only" switch. */
export function StopResources({ stopId, cards }: { stopId: string; cards: ResourceCardData[] }) {
  const progress = useProgress();
  const today = useToday();
  const ordered = orderResources(cards, { freeOnly: progress.freeOnly });
  const hasPaid = cards.some((c) => c.cost === "paid");

  // Opening a resource starts the stop, unless the learner already has a status for it.
  const start = () => {
    if (!progress.stops[stopId] && today) setStop(stopId, { status: "in_progress", updatedOn: today });
  };

  return (
    <div className="mt-3 flex flex-col gap-3">
      {hasPaid && (
        <label className="flex min-h-12 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="size-5 accent-emerald-700"
            checked={progress.freeOnly}
            onChange={(e) => setFreeOnly(e.target.checked)}
          />
          <span>Free only: show free courses first</span>
        </label>
      )}
      <ul className="flex flex-col gap-3">
        {ordered.map((r, i) => (
          <li key={r.id}>
            <ResourceCard r={r} role={i === 0 ? "primary" : "alternate"} stopId={stopId} today={today} onOpen={start} />
          </li>
        ))}
      </ul>
    </div>
  );
}
