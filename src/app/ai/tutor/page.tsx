import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { aiEnabled } from "@/lib/ai/settings";
import { getPaths, getStops } from "@/lib/content";
import { TutorChat } from "./tutor-chat";

export const metadata: Metadata = {
  title: "AI tutor for learning AI",
  description: "An AI tutor that explains any AI topic, knows your progress, plans your week and answers career questions about learning AI in India. Also built into every lesson.",
  alternates: { canonical: "/ai/tutor" },
};

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
        {/* SU-5: AI tools work without an account. */}
        <TutorChat enabled={aiEnabled()} paths={getPaths().map((p) => ({ id: p.id, name: p.name }))} titles={titles} />
      </div>
    </main>
  );
}
