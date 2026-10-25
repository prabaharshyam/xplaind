import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { primaryButton, secondaryButton, textLink } from "@/components/ui";
import { getPaths } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import { InterviewList } from "./interview-list";

export const metadata: Metadata = {
  title: "AI interview questions with answers",
  description:
    "AI interview questions for nine roles, from GenAI engineer and forward deployed engineer to AI product manager and ML engineer, each with a short answer, a deeper answer, follow-ups and common mistakes.",
  alternates: { canonical: "/interview" },
};

export default function InterviewPage() {
  const questions = getInterviewViews();
  const paths = getPaths();
  return (
    <main>
      <PageHero
        theme="career"
        seed="interview"
        icon="mic"
        eyebrow="Interview prep"
        title="AI interview questions"
        lead={`${questions.length} questions AI interviews ask, each with a short answer you can say out loud, a deeper answer, the follow-ups to expect and the mistakes to avoid.`}
      />
      <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/interview/simulator" className={primaryButton}>
          Try the mock interview
        </Link>
        <Link href="/practice" className={secondaryButton}>
          Practise with flashcards
        </Link>
      </div>
      <nav aria-labelledby="by-role" className="mt-8">
        <h2 id="by-role" className="text-lg font-semibold">
          Questions by role
        </h2>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          {paths.map((p) => (
            <li key={p.id}>
              <Link href={`/interview/for/${p.id}`} className={textLink}>
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-8">
        <InterviewList questions={questions} paths={paths.map((p) => ({ id: p.id, name: p.name }))} />
      </div>
      </div>
    </main>
  );
}
