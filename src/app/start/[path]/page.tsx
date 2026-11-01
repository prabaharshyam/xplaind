import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { notFound } from "next/navigation";
import { getPath, getPaths } from "@/lib/content";
import { DEFAULT_PATH_ID } from "@/lib/paths";
import { TestPage } from "../test-page";

// The default path's test lives at /start.
export function generateStaticParams() {
  return getPaths()
    .filter((p) => p.placement === "ladder" && p.id !== DEFAULT_PATH_ID)
    .map((p) => ({ path: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/start/[path]">): Promise<Metadata> {
  const path = getPath((await params).path);
  return path
    ? pageMeta({
        title: `${path.name} level test`,
        description: `A 10-minute test that finds where to start on the ${path.name} roadmap, so you skip what you already know. No sign-up needed.`,
        path: `/start/${path.id}`,
      })
    : {};
}

export default async function StartForPath({ params }: PageProps<"/start/[path]">) {
  const path = getPath((await params).path);
  if (!path || path.placement !== "ladder" || path.id === DEFAULT_PATH_ID) notFound();
  return <TestPage goal={path} />;
}
