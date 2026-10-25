import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { muted, textLink } from "@/components/ui";
import { GENAI_PATH_ID, getContent, getGlossary, getLevel, getStop, getStops, pathsWithLesson } from "@/lib/content";
import { roadmapHref } from "@/lib/paths";
import { resourceCard } from "@/lib/content/cards";
import { getInterviewViews } from "@/lib/content/interview";
import type { CheckQuestionView } from "./stop-progress";
import { StopProgressPanel } from "./stop-progress";
import { StopResources } from "./stop-resources";

/** Lesson text: headings, lists, code and tables styled without a typography plugin. Code scrolls inside its box at 360px. */
const PROSE =
  "mt-2 leading-7 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:font-semibold [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_strong]:font-semibold [&_pre]:mt-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-100 [&_pre]:p-3 [&_pre]:text-sm dark:[&_pre]:bg-zinc-900 [&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-zinc-100 [&_:not(pre)>code]:px-1 dark:[&_:not(pre)>code]:bg-zinc-900 [&_table]:mt-3 [&_table]:block [&_table]:overflow-x-auto [&_td]:border [&_td]:border-zinc-300 [&_td]:p-2 [&_th]:border [&_th]:border-zinc-300 [&_th]:p-2 [&_th]:text-left dark:[&_td]:border-zinc-700 dark:[&_th]:border-zinc-700";

/** Code blocks scroll sideways on phones, so keyboard users must be able to focus them (WCAG 2.1.1). */
const MDX_COMPONENTS = {
  pre: (props: React.ComponentProps<"pre">) => <pre tabIndex={0} {...props} />,
};

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
  const paths = pathsWithLesson(stop.id);
  const onGenai = paths.some((p) => p.id === GENAI_PATH_ID);
  const terms = stop.key_terms.map((id) => getGlossary().find((g) => g.id === id)!);
  const explainer = stop.format === "explainer";
  const interview = getInterviewViews().filter((q) => q.stop.id === stop.id);
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
        {onGenai ? (
          <>
            <Link href={roadmapHref(GENAI_PATH_ID)} className={textLink}>
              Roadmap
            </Link>
            <span className={muted}> / </span>
            <Link href={`/roadmap/genai-engineer/${stop.level.toLowerCase()}`} className={textLink}>
              {stop.level} {level?.name}
            </Link>
          </>
        ) : (
          <Link href="/paths" className={textLink}>
            Paths
          </Link>
        )}
      </nav>
      <p className={`mt-4 text-sm ${muted}`}>
        {stop.level} · {level?.name} · about {stop.hours} {stop.hours === 1 ? "hour" : "hours"}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">{stop.title}</h1>
      <p className="mt-4 text-lg leading-8">{stop.outcome}</p>
      {paths.length > 0 && (
        <p className={`mt-3 text-sm ${muted}`}>
          On {paths.length === 1 ? "the path" : "these paths"}:{" "}
          {paths.map((p, i) => (
            <span key={p.id}>
              {i > 0 && ", "}
              <Link href={roadmapHref(p.id)} className={textLink}>
                {p.name}
              </Link>
            </span>
          ))}
        </p>
      )}

      <h2 className="mt-8 text-xl font-semibold">Why it matters</h2>
      <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">{stop.why_it_matters}</p>

      {explainer ? (
        <>
          <div className={PROSE}>
            <MDXRemote source={stop.body} components={MDX_COMPONENTS} />
          </div>

          {terms.length > 0 && (
            <section aria-labelledby="terms-heading" className="mt-8 rounded-xl bg-zinc-100 p-4 dark:bg-zinc-900">
              <h2 id="terms-heading" className="text-xl font-semibold">
                Key terms
              </h2>
              <dl className="mt-3 flex flex-col gap-3">
                {terms.map((t) => (
                  <div key={t.id}>
                    <dt className="font-medium">
                      <Link href={`/glossary#${t.id}`} className={textLink}>
                        {t.term}
                      </Link>
                    </dt>
                    <dd className="leading-7">{t.definition}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <h2 className="mt-8 text-xl font-semibold">Go deeper: the best free course</h2>
          <StopResources stopId={stop.id} cards={cards} />
        </>
      ) : (
        <>
          <h2 className="mt-8 text-xl font-semibold">Learn it</h2>
          <StopResources stopId={stop.id} cards={cards} />

          <h2 className="mt-8 text-xl font-semibold">Do it</h2>
          <div className={PROSE}>
            <MDXRemote source={stop.body} components={MDX_COMPONENTS} />
          </div>
        </>
      )}

      <h2 className="mt-8 text-xl font-semibold">Check</h2>
      <StopProgressPanel stopId={stop.id} check={check} />

      {interview.length > 0 && (
        <>
          <h2 className="mt-10 text-xl font-semibold">Interview questions on this</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {interview.map((q) => (
              <li key={q.id}>
                <Link href={`/interview/${q.id}`} className={textLink}>
                  {q.question}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
