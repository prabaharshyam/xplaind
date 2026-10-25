import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { muted, textLink } from "@/components/ui";
import { getPath, getPaths } from "@/lib/content";
import { pathView } from "@/lib/content/paths";
import { CODING_LABEL } from "@/lib/paths";
import { PathMap } from "./path-map";

// Paths laid out in stages. GenAI Engineer, laid out by level, has its own route.
export function generateStaticParams() {
  return getPaths()
    .filter((p) => p.layout === "stages")
    .map((p) => ({ path: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/roadmap/[path]">): Promise<Metadata> {
  const path = getPath((await params).path);
  return path ? { title: `${path.name} roadmap`, description: path.tagline } : {};
}

export default async function PathPage({ params }: PageProps<"/roadmap/[path]">) {
  const path = getPath((await params).path);
  if (!path || path.layout !== "stages") notFound();
  const view = pathView(path);
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/paths" className={textLink}>
          Paths
        </Link>
      </nav>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">{view.name}</h1>
      <p className="mt-3 text-lg leading-8">{view.description}</p>
      <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
        <span className="font-medium">Who it is for:</span> {view.who_for}
      </p>
      <p className={`mt-2 text-sm ${muted}`}>
        {CODING_LABEL[view.coding]} · {view.stages.length} stages · {view.counts.lessons} lessons written
        {view.counts.planned > 0 && `, ${view.counts.planned} more being written`} · about {view.counts.hours} hours of
        written lessons
      </p>
      <div className="mt-8">
        <PathMap path={view} known={getPaths().map((p) => p.id)} />
      </div>
    </main>
  );
}
