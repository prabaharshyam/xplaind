import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { TopicDrawerProvider } from "@/components/roadmap/topic-drawer";
import { getPath, getPaths } from "@/lib/content";
import { topicDetails } from "@/lib/content/drawer";
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
  const view = pathView(path);
  const lessonIds = view.stages.flatMap((st) => st.lessons.map((l) => l.id));
  return (
    <main>
      <PageHero
        theme={path.theme}
        seed={path.id}
        eyebrow="Role roadmap"
        title={view.name}
        lead={view.description}
        crumbs={[{ href: "/paths", label: "Roadmaps" }]}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          {[CODING_LABEL[view.coding], `${view.stages.length} stages`, `${view.counts.lessons} lessons`, `about ${view.months} months`].map((c) => (
            <span key={c} className="rounded-full bg-zinc-200/70 px-3 py-1 dark:bg-zinc-800">
              {c}
            </span>
          ))}
        </p>
        <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          <span className="font-medium">Who it is for:</span> {view.who_for}
        </p>
      </PageHero>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="mb-6 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:bg-sky-950 dark:text-sky-100">
          Tip: tap any topic to see what it is, the best free course and mark it done, without leaving the map.
        </p>
        <TopicDrawerProvider details={topicDetails(lessonIds)}>
          <PathMap path={view} known={getPaths().map((p) => p.id)} />
        </TopicDrawerProvider>
      </div>
    </main>
  );
}
