import type { Metadata } from "next";
import Link from "next/link";
import { ChoosePath } from "@/components/choose-path";
import { textLink } from "@/components/ui";
import { roadmapData } from "./data";
import { RoadmapPath } from "./roadmap-path";

export const metadata: Metadata = {
  title: "GenAI Engineer roadmap",
  description: "Nine levels from AI newcomer to AI system designer, each step with the best free or low-cost course.",
};

export default function RoadmapPage() {
  const { goal, levels, stops } = roadmapData();
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/paths" className={textLink}>
          Paths
        </Link>
      </nav>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance">{goal.name}</h1>
      <p className="mt-3 mb-8 leading-7 text-zinc-700 dark:text-zinc-300">
        Nine levels. Each step teaches one thing, links the best free or low-cost course for it, and ends in a
        check or a project. Your progress is saved on this device.
      </p>
      <div className="mb-8">
        <ChoosePath pathId={goal.id} />
      </div>
      <RoadmapPath levels={levels} stops={stops} />
    </main>
  );
}
