import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { aiEnabled } from "@/lib/ai/settings";
import { getPaths, getStops } from "@/lib/content";
import { TutorChat } from "./tutor-chat";

export const metadata: Metadata = pageMeta({
  // SE-8: search-led title and description.
  title: ["AI Tutor: Learn AI With Explanations Made for You", "AI Tutor for Learning AI"],
  description:
    "An AI tutor for learning AI: it explains any AI or ML topic, plans your week and answers AI career questions for India. It knows your progress.",
  path: "/ai/tutor",
});

export default function TutorPage() {
  const titles = Object.fromEntries(getStops().map((s) => [s.id, s.title]));
  return (
    <main>
      <PageHero shape="robot"
        theme="career"
        seed="ai-tutor"
        icon="chat"
        eyebrow="AI tutor"
        title="A tutor that knows where you are"
        lead="Ask it to explain any AI topic, plan your week or help you get hired. It sees your progress and points you to the right lessons. The same tutor sits inside every lesson."
        crumbs={[{ href: "/ai", label: "AI tools" }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        {/* AG-1: needs an account once sign-ups are open; while they are on hold, guests keep their limits (SU-5). */}
        <TutorChat enabled={aiEnabled()} paths={getPaths().map((p) => ({ id: p.id, name: p.name }))} titles={titles} />
      </div>
    </main>
  );
}
