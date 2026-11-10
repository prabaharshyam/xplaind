import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { aiEnabled } from "@/lib/ai/settings";
import { RoadmapStudio } from "./roadmap-studio";

export const metadata: Metadata = pageMeta({
  // SE-8: search-led title and description.
  title: ["AI Roadmap Generator: Your Personal Plan to Learn AI", "AI Roadmap Generator: Your Personal Plan"],
  description:
    "Give your goal, starting point and weekly hours, and get a week-by-week plan to learn AI, linked to our lessons. Change it in plain words.",
  path: "/ai/roadmap",
});

export default function AiRoadmapPage() {
  return (
    <main>
      <PageHero shape="mapRoute"
        theme="ai-basics"
        seed="ai-roadmap"
        icon="map"
        eyebrow="AI roadmap generator"
        title="Your own roadmap, in a minute"
        lead="Say what you want to do with AI, where you are starting and how much time you have. Get a stage-by-stage plan linked to our lessons, tick topics off as you go, and change it in plain words."
        crumbs={[{ href: "/ai", label: "AI tools" }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        {/* AG-1: needs an account once sign-ups are open; while they are on hold, guests keep their limits (SU-5). */}
        <RoadmapStudio enabled={aiEnabled()} />
      </div>
    </main>
  );
}
