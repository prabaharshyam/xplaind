import type { Metadata } from "next";
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
  return path ? { title: `Find my level: ${path.name}`, description: `A short test finds where to start on the ${path.name} path.` } : {};
}

export default async function StartForPath({ params }: PageProps<"/start/[path]">) {
  const path = getPath((await params).path);
  if (!path || path.placement !== "ladder" || path.id === DEFAULT_PATH_ID) notFound();
  return <TestPage goal={path} />;
}
