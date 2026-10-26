import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { primaryButton, secondaryButton } from "@/components/ui";
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
    <main>
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
      <PageHero
        theme={path.theme}
        seed={`interview-${path.id}`}
        icon="mic"
        eyebrow="Interview prep"
        title={`${path.name} interview questions`}
        lead={`${questions.length} questions a ${path.name} interview is likely to ask, with short answers you can say out loud. Then practise them in a timed mock interview.`}
        crumbs={[{ href: "/interview", label: "Interview questions" }]}
      >
        <div className="flex flex-wrap gap-3">
          <Link href={`/interview/simulator?path=${path.id}`} className={primaryButton}>
            Start a {path.name} mock interview
          </Link>
          <Link href={roadmapHref(path.id)} className={secondaryButton}>
            {path.name} roadmap
          </Link>
        </div>
      </PageHero>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <InterviewList questions={questions} />
      </div>
    </main>
  );
}
