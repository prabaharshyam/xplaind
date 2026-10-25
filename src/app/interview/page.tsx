import type { Metadata } from "next";
import Link from "next/link";
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
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">AI interview questions</h1>
      <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
        {questions.length} questions that AI interviews ask, each with a short answer you can say out loud, a deeper
        answer, the follow-ups to expect and the mistakes to avoid. Each one links to the lesson that teaches it.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
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
    </main>
  );
}
