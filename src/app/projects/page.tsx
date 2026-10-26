import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { getPaths, getProjects, getStop, stagesWithGuide } from "@/lib/content";
import { ProjectList, type ProjectCardView } from "./project-list";

export const metadata: Metadata = {
  title: "Guided AI projects: build a portfolio step by step",
  description:
    "Free, step-by-step AI projects for every role: a brief, steps with hints, a rubric to check your work and the lessons each one uses. Build the portfolio employers ask for.",
  alternates: { canonical: "/projects" },
};

/** GP-3: every guided project, filterable by path and difficulty. */
export default function ProjectsPage() {
  const projects: ProjectCardView[] = getProjects().map((p) => {
    const on = stagesWithGuide(p.id);
    const last = getStop(p.lessons[p.lessons.length - 1]);
    return {
      id: p.id,
      title: p.title,
      summary: p.summary,
      difficulty: p.difficulty,
      hours: p.hours,
      steps: p.steps.length,
      theme: last?.theme ?? "code",
      paths: [...new Set(on.map((o) => o.path.id))],
      where: on.map((o) => `${o.path.name}: ${o.stageTitle}`),
    };
  });
  return (
    <main>
      <PageHero
        theme="career"
        seed="projects"
        icon="trophy"
        eyebrow="Build your portfolio"
        title="Guided projects"
        lead="Each roadmap stage ends in a project that proves you can do the work. Follow the steps, check yourself against the rubric, and share the link."
      />
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <ProjectList projects={projects} paths={getPaths().map((p) => ({ id: p.id, name: p.name }))} />
      </div>
    </main>
  );
}
