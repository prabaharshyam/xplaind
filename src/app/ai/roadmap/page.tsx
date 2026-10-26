import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { aiEnabled } from "@/lib/ai/settings";
import { RoadmapStudio } from "./roadmap-studio";

export const metadata: Metadata = {
  title: "AI roadmap generator: a personal plan to learn AI",
  description:
    "Tell us your goal, your starting point and your hours. Get a personal, week-by-week AI learning roadmap linked to free lessons, then change it in plain words.",
  alternates: { canonical: "/ai/roadmap" },
};

export default function AiRoadmapPage() {
  return (
    <main>
      <PageHero
        theme="ai-basics"
        seed="ai-roadmap"
        icon="map"
        eyebrow="AI roadmap generator"
        title="Your own roadmap, in a minute"
        lead="Say what you want to do with AI, where you are starting and how much time you have. Get a stage-by-stage plan linked to our free lessons, tick topics off as you go, and change it in plain words."
        crumbs={[{ href: "/ai", label: "AI tools" }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <RoadmapStudio enabled={aiEnabled()} />
      </div>
    </main>
  );
}
