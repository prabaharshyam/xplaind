import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { getPaths, pathLessons } from "@/lib/content";
import { siteUrl } from "@/lib/site";
import { PlanStudio } from "./plan-studio";

export const metadata: Metadata = {
  title: "Stay on track: your weekly AI study plan",
  description: "Stay on track with AI: this week's lessons on your role roadmap, sized to your hours, a practice session, a Monday calendar reminder and an optional weekly progress email.",
  alternates: { canonical: "/plan" },
};

export default function PlanPage() {
  const paths = getPaths();
  const lessons = Object.fromEntries(paths.map((p) => [p.id, pathLessons(p.id).map((s) => ({ id: s.id, title: s.title, hours: s.hours }))]));
  return (
    <main>
      <PageHero
        size="full"
        shape="calendar"
        theme="career"
        seed="plan"
        icon="map"
        eyebrow="Stay on track"
        title="Your study plan for this week"
        lead="The next lessons on your roadmap, sized to the hours you have, plus one practice session. Add a Monday reminder to your calendar, or get a short progress email every Monday."
      />
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <PlanStudio paths={paths.map((p) => ({ id: p.id, name: p.name }))} lessons={lessons} planUrl={`${siteUrl()}/plan`} />
      </div>
    </main>
  );
}
