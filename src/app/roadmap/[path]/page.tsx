import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
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
        title: `${path.name} roadmap ${contentUpdatedOn().slice(0, 4)}`,
        description: `${path.tagline} Every topic in order, with a plain-English lesson, video lessons and a project per stage.`,
        path: `/roadmap/${path.id}`,
      })
    : {};
}

export default async function PathPage({ params }: PageProps<"/roadmap/[path]">) {
  const path = getPath((await params).path);
  if (!path || path.layout !== "stages") notFound();
  return <RoadmapPage path={path} />;
}
