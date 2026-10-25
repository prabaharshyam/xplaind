import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { muted, primaryButton, textLink } from "@/components/ui";
import { getPath, getPaths } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import { roadmapHref } from "@/lib/paths";
import { siteUrl } from "@/lib/site";
import { InterviewList } from "../../interview-list";

export function generateStaticParams() {
  return getPaths().map((p) => ({ path: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/interview/for/[path]">): Promise<Metadata> {
  const path = getPath((await params).path);
  if (!path) return {};
  const n = getInterviewViews().filter((q) => q.paths.includes(path.id)).length;
  return {
    title: `${path.name} interview questions and answers`,
    description: `${n} ${path.name} interview questions with short answers you can say out loud, deeper answers, follow-ups and common mistakes. Then practise them in a timed mock interview.`,
    alternates: { canonical: `/interview/for/${path.id}` },
  };
}

/** IQ-3: one role's interview questions, for people who search by job title. */
export default async function PathInterviewPage({ params }: PageProps<"/interview/for/[path]">) {
  const path = getPath((await params).path);
  if (!path) notFound();
  const questions = getInterviewViews().filter((q) => q.paths.includes(path.id));
  const base = siteUrl();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          name: `${path.name} interview questions`,
          url: `${base}/interview/for/${path.id}`,
          mainEntity: questions.map((q) => ({
            "@type": "Question",
            name: q.question,
            url: `${base}/interview/${q.id}`,
            acceptedAnswer: { "@type": "Answer", text: q.short_answer },
          })),
        }}
      />
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/interview" className={textLink}>
          Interview questions
        </Link>
        <span className={muted}> / {path.name}</span>
      </nav>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance">{path.name} interview questions</h1>
      <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
        {questions.length} questions a {path.name} interview is likely to ask, from the lessons on our{" "}
        <Link href={roadmapHref(path.id)} className={textLink}>
          {path.name} path
        </Link>
        . Read the short answer, then say your own version out loud in the mock interview, where a timer and a checklist
        of key points show what you missed.
      </p>
      <Link href={`/interview/simulator?path=${path.id}`} className={`mt-5 ${primaryButton}`}>
        Start a {path.name} mock interview
      </Link>
      <div className="mt-8">
        <InterviewList questions={questions} />
      </div>
    </main>
  );
}
