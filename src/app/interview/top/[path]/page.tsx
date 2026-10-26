import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DraftNote } from "@/components/draft-note";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { primaryButton, textLink } from "@/components/ui";
import { getPath, getPaths } from "@/lib/content";
import { topInterview } from "@/lib/content/interview";
import { siteUrl } from "@/lib/site";
import { KIND_LABEL, KIND_STYLE } from "../kinds";
import { PrintButton } from "../print-button";

export function generateStaticParams() {
  return getPaths().filter((p) => p.top_interview.length).map((p) => ({ path: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/interview/top/[path]">): Promise<Metadata> {
  const path = getPath((await params).path);
  if (!path) return {};
  return {
    title: `Top 25 ${path.name} interview questions and answers, with examples`,
    description: `The 25 ${path.name} interview questions most worth preparing: scenario, use-case and real-life questions, each with a short answer, a clear explanation and an example you can tell in the interview.`,
    alternates: { canonical: `/interview/top/${path.id}` },
  };
}

/** IQ-8: one role's Top 25 interview questions on one page, to read, print and practise. */
export default async function TopInterviewPage({ params }: PageProps<"/interview/top/[path]">) {
  const path = getPath((await params).path);
  if (!path) notFound();
  const questions = topInterview(path.id);
  if (questions.length === 0) notFound();
  const practical = questions.filter((q) => q.kind !== "concept").length;
  const base = siteUrl();

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          name: `Top 25 ${path.name} interview questions`,
          url: `${base}/interview/top/${path.id}`,
          mainEntity: questions.map((q) => ({ "@type": "Question", name: q.question, acceptedAnswer: { "@type": "Answer", text: q.short_answer } })),
        }}
      />
      <PageHero
        theme={path.theme}
        seed={`top-${path.id}`}
        icon="trophy"
        eyebrow="Interview prep"
        title={`Top 25 ${path.name} interview questions`}
        lead={`${practical} of these 25 are scenario, use-case or real-life questions, the kind that decide an interview. Each has a short answer to say out loud, the explanation behind it, and an example you can tell.`}
        crumbs={[
          { href: "/interview", label: "Interview questions" },
          { href: `/interview/for/${path.id}`, label: path.name },
        ]}
      >
        <div className="flex flex-wrap gap-3 print:hidden">
          <Link href={`/interview/simulator?path=${path.id}`} className={primaryButton}>
            Practise out loud
          </Link>
          <PrintButton />
        </div>
      </PageHero>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <nav aria-label="The 25 questions" className="rounded-2xl bg-zinc-100 p-4 print:hidden dark:bg-zinc-900">
          <h2 className="font-semibold">Jump to a question</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-6 text-sm">
            {questions.map((q) => (
              <li key={q.id}>
                <a href={`#${q.id}`} className={textLink}>
                  {q.question}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <ol className="mt-8 flex flex-col gap-8">
          {questions.map((q, i) => (
            <li key={q.id} id={q.id} className="scroll-mt-20 break-inside-avoid-page">
              <article aria-labelledby={`${q.id}-h`} className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
                <p className="flex flex-wrap items-center gap-2 text-xs font-medium">
                  <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-white dark:bg-white dark:text-zinc-900">{i + 1}</span>
                  <span className={`rounded-full px-2 py-0.5 ${KIND_STYLE[q.kind]}`}>{KIND_LABEL[q.kind]}</span>
                  <span className="text-zinc-600 dark:text-zinc-400">{q.level}</span>
                </p>
                <h2 id={`${q.id}-h`} className="mt-2 text-xl leading-snug font-semibold text-balance">
                  {q.question}
                </h2>
                {!q.reviewed && <DraftNote />}

                <h3 className="mt-4 text-sm font-semibold tracking-wide text-emerald-800 uppercase dark:text-emerald-400">Short answer</h3>
                <p className="mt-1 leading-7">{q.short_answer}</p>

                <h3 className="mt-4 text-sm font-semibold tracking-wide text-zinc-700 uppercase dark:text-zinc-300">The explanation</h3>
                {q.deeper_answer.split(/\n\n+/).map((p, k) => (
                  <p key={k} className="mt-1 leading-7 text-zinc-800 dark:text-zinc-200">
                    {p}
                  </p>
                ))}

                {q.example && (
                  <figure className="mt-4 rounded-xl border-l-4 border-violet-600 bg-violet-50 p-4 dark:bg-violet-950/30">
                    <figcaption className="text-sm font-semibold text-violet-900 dark:text-violet-200">An example you can use in the interview</figcaption>
                    {q.example.split(/\n\n+/).map((p, k) => (
                      <p key={k} className="mt-1 leading-7">
                        {p}
                      </p>
                    ))}
                  </figure>
                )}

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold">They may follow up with</h3>
                    <ul className="mt-1 list-disc pl-5 text-sm leading-6">
                      {q.follow_ups.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                  {q.common_mistakes.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold">Avoid</h3>
                      <ul className="mt-1 list-disc pl-5 text-sm leading-6">
                        {q.common_mistakes.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm print:hidden">
                  <Link href={`/interview/${q.id}`} className={textLink}>
                    Practise this one
                  </Link>
                  <Link href={`/stop/${q.stop.id}`} className={textLink}>
                    Lesson: {q.stop.title}
                  </Link>
                </p>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
