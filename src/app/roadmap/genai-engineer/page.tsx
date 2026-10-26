import type { Metadata } from "next";
import { ChoosePath } from "@/components/choose-path";
import { PageHero } from "@/components/page-hero";
import { TopicDrawerProvider } from "@/components/roadmap/topic-drawer";
import { topicDetails } from "@/lib/content/drawer";
import { roadmapData } from "./data";
import { RoadmapPath } from "./roadmap-path";

export const metadata: Metadata = {
  title: "GenAI Engineer roadmap: free, step by step",
  description:
    "A free GenAI engineer roadmap in nine levels, from AI newcomer to AI system designer: Python, LLM APIs, RAG, agents, evals and deployment, each step with the best free course.",
  alternates: { canonical: "/roadmap/genai-engineer" },
};

export default function RoadmapPage() {
  const { goal, levels, stops } = roadmapData();
  return (
    <main>
      <PageHero
        theme="llm"
        seed={goal.id}
        eyebrow="Role roadmap"
        title={goal.name}
        lead="Nine levels from your first prompt to designing AI systems. Each step teaches one thing, links the best free course for it, and ends in a check or a project."
        crumbs={[{ href: "/paths", label: "Roadmaps" }]}
      >
        <ChoosePath pathId={goal.id} />
      </PageHero>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="mb-6 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:bg-sky-950 dark:text-sky-100">
          Tip: tap any topic to see what it is, the best free course and mark it done, without leaving the map.
        </p>
        <TopicDrawerProvider details={topicDetails(stops.map((s) => s.id))}>
          <RoadmapPath levels={levels} stops={stops} />
        </TopicDrawerProvider>
      </div>
    </main>
  );
}
