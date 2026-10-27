import { PageHero } from "@/components/page-hero";
import { RoadmapView } from "@/components/roadmap/roadmap-view";
import { TopicDrawerProvider } from "@/components/roadmap/topic-drawer";
import { getPaths } from "@/lib/content";
import { topicDetails } from "@/lib/content/drawer";
import { pathView } from "@/lib/content/paths";
import { roadmapModel } from "@/lib/content/roadmap";
import type { Goal } from "@/lib/content/schema";
import { CODING_LABEL } from "@/lib/paths";
import { roadmapStopIds } from "@/lib/roadmap/view";

/** Every path's roadmap page, so they all look and work the same (RM-1). */
export function RoadmapPage({ path }: { path: Goal }) {
  const view = pathView(path);
  const model = roadmapModel(path);
  const lessons = view.stages.flatMap((st) => st.lessons);
  const sections = model.sections.length;
  return (
    <main>
      <PageHero theme={path.theme ?? "llm"} seed={path.id} eyebrow="Role roadmap" title={view.name} lead={view.description} crumbs={[{ href: "/paths", label: "Roadmaps" }]}>
        <p className="flex flex-wrap gap-2 text-sm">
          {[CODING_LABEL[view.coding], `${sections} ${path.layout === "levels" ? "levels" : "stages"}`, `${view.counts.lessons} lessons`, `about ${view.months} months`].map((c) => (
            <span key={c} className="rounded-full bg-zinc-200/70 px-3 py-1 dark:bg-zinc-800">
              {c}
            </span>
          ))}
        </p>
        <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          <span className="font-medium">Who it is for:</span> {view.who_for}
        </p>
      </PageHero>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <TopicDrawerProvider details={topicDetails(roadmapStopIds(model))}>
          <RoadmapView model={model} lessons={lessons} known={getPaths().map((p) => p.id)} />
        </TopicDrawerProvider>
      </div>
    </main>
  );
}
