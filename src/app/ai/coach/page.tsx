import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { aiEnabled } from "@/lib/ai/settings";
import { getPaths, getStops } from "@/lib/content";
import { Coach } from "./coach";

export const metadata: Metadata = {
  title: "Personal AI learning coach",
  description: "A free AI coach that knows your progress, plans your week and answers career questions about learning AI in India.",
  alternates: { canonical: "/ai/coach" },
};

export default function CoachPage() {
  const titles = Object.fromEntries(getStops().map((s) => [s.id, s.title]));
  return (
    <main>
      <PageHero
        theme="career"
        seed="ai-coach"
        icon="people"
        eyebrow="Personal AI coach"
        title="A coach that knows where you are"
        lead="Ask what to learn next, how to fit study into your week, or how to get hired. Your coach sees your progress and points you to the right free lessons."
        crumbs={[{ href: "/ai", label: "AI tools" }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <Coach enabled={aiEnabled()} paths={getPaths().map((p) => ({ id: p.id, name: p.name }))} titles={titles} />
      </div>
    </main>
  );
}
