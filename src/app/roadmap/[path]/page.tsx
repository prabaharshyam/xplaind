import type { Metadata } from "next";
import { pageMeta, roadmapTitles } from "@/lib/seo";
import { notFound } from "next/navigation";
import { contentUpdatedOn, getPath, getPaths } from "@/lib/content";
import { RoadmapPage } from "../roadmap-page";

// Paths laid out in stages. Generative AI & LLM Engineer, laid out by level, has its own route for its level pages.
export function generateStaticParams() {
  return getPaths()
    .filter((p) => p.layout === "stages")
    .map((p) => ({ path: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/roadmap/[path]">): Promise<Metadata> {
  const path = getPath((await params).path);
  return path
    ? pageMeta({
        // SE-8: matches "<role> roadmap 2026", "... for beginners" and "... free" searches.
        title: roadmapTitles(path.name, contentUpdatedOn().slice(0, 4)),
        description: `${path.name} roadmap ${contentUpdatedOn().slice(0, 4)}, from beginner to job-ready: ${path.stages.reduce((n, s) => n + s.lessons.length, 0)} topics in ${path.stages.length} stages, each with a lesson, the best course and a project. ${path.tagline}`,
        path: `/roadmap/${path.id}`,
      })
    : {};
}

export default async function PathPage({ params }: PageProps<"/roadmap/[path]">) {
  const path = getPath((await params).path);
  if (!path || path.layout !== "stages") notFound();
  return <RoadmapPage path={path} />;
}
