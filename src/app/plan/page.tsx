import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { getPaths, pathLessons } from "@/lib/content";
import { siteUrl } from "@/lib/site";
import { PlanStudio } from "./plan-studio";

export const metadata: Metadata = {
  title: "Your weekly AI study plan",
  description: "A study plan for this week, sized to your hours: the next lessons on your AI role roadmap, a practice session, and a Monday reminder in your calendar.",
  alternates: { canonical: "/plan" },
};

export default function PlanPage() {
  const paths = getPaths();
  const lessons = Object.fromEntries(paths.map((p) => [p.id, pathLessons(p.id).map((s) => ({ id: s.id, title: s.title, hours: s.hours }))]));
  return (
    <main>
      <PageHero
        shape="calendar"
        theme="career"
        seed="plan"
        icon="map"
        eyebrow="Weekly plan"
        title="Your study plan for this week"
        lead="The next lessons on your roadmap, sized to the hours you have, plus one practice session. Tick lessons off as you finish them, and add a Monday reminder to your calendar."
      />
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <PlanStudio paths={paths.map((p) => ({ id: p.id, name: p.name }))} lessons={lessons} planUrl={`${siteUrl()}/plan`} />
      </div>
    </main>
  );
}
