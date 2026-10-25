import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { muted, textLink } from "@/components/ui";
import { getContent, getLevel, getStop, getStops } from "@/lib/content";
import { resourceCard } from "@/lib/content/cards";
import type { CheckQuestionView } from "./stop-progress";
import { StopProgressPanel } from "./stop-progress";
import { StopResources } from "./stop-resources";

export function generateStaticParams() {
  return getStops().map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/stop/[id]">): Promise<Metadata> {
  const stop = getStop((await params).id);
  return stop ? { title: stop.title, description: stop.outcome } : {};
}

export default async function StopPage({ params }: PageProps<"/stop/[id]">) {
  const stop = getStop((await params).id);
  if (!stop) notFound();

  const level = getLevel(stop.level);
  const cards = [stop.primary_resource, ...stop.alternates].map(resourceCard);
  const checks = new Map(getContent().checks.map(({ data: q }) => [q.id, q]));
  const check =
    stop.check.type === "project"
      ? { type: "project" as const, brief: stop.check.brief }
      : {
          type: "mcq" as const,
          questions: stop.check.question_ids.map((id): CheckQuestionView => {
            const q = checks.get(id)!;
            return { id: q.id, stem: q.stem, options: q.options, correct: q.correct, explanation: q.explanation };
          }),
        };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/roadmap/genai-engineer" className={textLink}>
          Roadmap
        </Link>
        <span className={muted}> / </span>
        <Link href={`/roadmap/genai-engineer/${stop.level.toLowerCase()}`} className={textLink}>
          {stop.level} {level?.name}
        </Link>
      </nav>
      <p className={`mt-4 text-sm ${muted}`}>
        {stop.level} · {level?.name} · about {stop.hours} {stop.hours === 1 ? "hour" : "hours"}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">{stop.title}</h1>
      <p className="mt-4 text-lg leading-8">{stop.outcome}</p>

      <h2 className="mt-8 text-xl font-semibold">Why it matters</h2>
      <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">{stop.why_it_matters}</p>

      <h2 className="mt-8 text-xl font-semibold">Learn it</h2>
      <StopResources stopId={stop.id} cards={cards} />

      <h2 className="mt-8 text-xl font-semibold">Do it</h2>
      <div className="mt-2 leading-7 [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
        <MDXRemote source={stop.body} />
      </div>

      <h2 className="mt-8 text-xl font-semibold">Check</h2>
      <StopProgressPanel stopId={stop.id} check={check} />
    </main>
  );
}
