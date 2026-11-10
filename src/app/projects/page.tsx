import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { getPaths, getProjects, getStop, stagesWithGuide } from "@/lib/content";
import { ProjectList, type ProjectCardView } from "./project-list";

export const metadata: Metadata = pageMeta({
  // SE-8: search-led title and description.
  title: ["AI Projects for Beginners: Build a Portfolio That Gets Hired", "AI Projects for Beginners: Guided"],
  description:
    "AI projects from beginner to advanced: a RAG chatbot, an AI agent, an automation and more, step by step with hints and a rubric for your portfolio.",
  path: "/projects",
});

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
      <PageHero shape="rocket"
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
