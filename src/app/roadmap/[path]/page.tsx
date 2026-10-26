import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPath, getPaths } from "@/lib/content";
import { RoadmapPage } from "../roadmap-page";

// Paths laid out in stages. GenAI Engineer, laid out by level, has its own route for its level pages.
export function generateStaticParams() {
  return getPaths()
    .filter((p) => p.layout === "stages")
    .map((p) => ({ path: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/roadmap/[path]">): Promise<Metadata> {
  const path = getPath((await params).path);
  return path
    ? {
        title: `${path.name} roadmap: free, step by step`,
        description: `${path.tagline} A free, step-by-step ${path.name} roadmap: every topic with a plain-English lesson, the best free course and a project per stage.`,
        alternates: { canonical: `/roadmap/${path.id}` },
      }
    : {};
}

export default async function PathPage({ params }: PageProps<"/roadmap/[path]">) {
  const path = getPath((await params).path);
  if (!path || path.layout !== "stages") notFound();
  return <RoadmapPage path={path} />;
}
