import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DraftNote } from "@/components/draft-note";
import { PageHero } from "@/components/page-hero";
import { muted, textLink } from "@/components/ui";
import { getProject, getProjects, getStop, stagesWithGuide } from "@/lib/content";
import { roadmapHref } from "@/lib/paths";
import { DIFFICULTY_LABEL } from "../shared";
import { ProjectGuide } from "./project-guide";

export function generateStaticParams() {
  return getProjects().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[id]">): Promise<Metadata> {
  const p = getProject((await params).id);
  return p ? { title: `${p.title}: a guided AI project`, description: p.summary, alternates: { canonical: `/projects/${p.id}` } } : {};
}

/** GP-2: one guided project, from brief to submission. */
export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const p = getProject((await params).id);
  if (!p) notFound();
  const lessons = p.lessons.map((id) => getStop(id)!);
  const on = stagesWithGuide(p.id);
  const theme = lessons[lessons.length - 1]?.theme ?? "code";

  return (
    <main>
      <PageHero theme={theme} seed={p.id} icon="trophy" eyebrow="Guided project" title={p.title} lead={p.summary} crumbs={[{ href: "/projects", label: "Projects" }]}>
        <p className="flex flex-wrap gap-2 text-sm">
          {[DIFFICULTY_LABEL[p.difficulty], `about ${p.hours} hours`, `${p.steps.length} steps`].map((c) => (
            <span key={c} className="rounded-full bg-zinc-200/70 px-3 py-1 dark:bg-zinc-800">
              {c}
            </span>
          ))}
        </p>
        {on.length > 0 && (
          <p className={`mt-3 text-sm ${muted}`}>
            On{" "}
            {on.map((o, i) => (
              <span key={`${o.path.id}-${o.stageId}`}>
                {i > 0 && ", "}
                <Link href={`${roadmapHref(o.path.id)}#projects`} className={textLink}>
                  {o.path.name}: {o.stageTitle}
                </Link>
              </span>
            ))}
          </p>
        )}
      </PageHero>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:px-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 lg:order-2">
          <div className="flex flex-col gap-4 lg:sticky lg:top-20">
            <section aria-labelledby="need-h" className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h2 id="need-h" className="font-semibold">
                You will need
              </h2>
              <ul className="mt-2 list-disc pl-5 text-sm leading-6">
                {p.you_will_need.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="uses-h" className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h2 id="uses-h" className="font-semibold">
                Lessons it uses
              </h2>
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {lessons.map((l) => (
                  <li key={l.id}>
                    <Link href={`/stop/${l.id}`} className={textLink}>
                      {l.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <div className="min-w-0 lg:order-1">
          <section aria-labelledby="deliver-h" className="mb-8 rounded-2xl bg-zinc-100 p-5 dark:bg-zinc-900">
            <h2 id="deliver-h" className="text-xl font-semibold">
              What you will show
            </h2>
            <ul className="mt-2 list-disc pl-5 leading-7">
              {p.deliverables.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </section>

          <ProjectGuide id={p.id} steps={p.steps} rubric={p.rubric} />

          {p.stretch.length > 0 && (
            <section aria-labelledby="stretch-h" className="mt-8">
              <h2 id="stretch-h" className="text-xl font-semibold">
                Go further
              </h2>
              <ul className="mt-2 list-disc pl-5 leading-7">
                {p.stretch.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </section>
          )}
          {p.drafted_with_ai && (
            <div className="mt-8">
              <DraftNote />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
