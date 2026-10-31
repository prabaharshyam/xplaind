import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { PageHero } from "@/components/page-hero";
import { RoadmapView } from "@/components/roadmap/roadmap-view";
import { TopicDrawerProvider } from "@/components/roadmap/topic-drawer";
import { getPaths, getStops } from "@/lib/content";
import { topicDetails } from "@/lib/content/drawer";
import { pathView } from "@/lib/content/paths";
import { roadmapModel } from "@/lib/content/roadmap";
import type { Goal } from "@/lib/content/schema";
import { CODING_LABEL } from "@/lib/paths";
import { roadmapStopIds } from "@/lib/roadmap/view";

/** Coding roles whose interviews include DSA and system design rounds. */
const INTERVIEW_TRACKS = new Set(["ai-engineer", "genai-engineer", "forward-deployed-engineer", "agentic-ai-expert", "ml-engineer", "mlops-engineer"]);

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
        {INTERVIEW_TRACKS.has(path.id) && <InterviewTracks />}
      </div>
    </main>
  );
}

/** The DSA and system design topic tracks, offered alongside coding roles for their interview rounds. */
function InterviewTracks() {
  const count = (theme: string) => getStops().filter((s) => s.theme === theme).length;
  const tracks = [
    { theme: "dsa", icon: "tree" as const, title: "Data structures and algorithms", lead: "Big-O, hash maps, trees and graphs, binary search, dynamic programming." },
    { theme: "system-design", icon: "server" as const, title: "System design", lead: "Scaling, databases, caching, queues and a full URL shortener design." },
  ];
  return (
    <section aria-labelledby="interview-tracks-h" className="mt-10 rounded-3xl bg-gradient-to-br from-fuchsia-50 via-violet-50 to-teal-50 p-5 ring-1 ring-violet-200 md:p-6 dark:from-fuchsia-950/30 dark:via-violet-950/30 dark:to-teal-950/30 dark:ring-violet-900">
      <h2 id="interview-tracks-h" className="text-lg font-semibold">
        Interview foundations for this role
      </h2>
      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">Coding interviews for this role usually include a DSA round and a system design round. Add these tracks alongside your roadmap.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {tracks.map((t) => (
          <Link key={t.theme} href={`/topics/${t.theme}`} className="lx-rise flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 hover:ring-violet-400 dark:bg-zinc-900 dark:ring-zinc-800">
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200">
              <Icon name={t.icon} size={22} />
            </span>
            <span>
              <span className="block font-semibold">{t.title}</span>
              <span className="mt-0.5 block text-sm text-zinc-700 dark:text-zinc-300">{t.lead}</span>
              <span className="mt-1 block text-xs font-medium text-violet-800 dark:text-violet-300">{count(t.theme)} lessons with video lessons</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
