import type { Metadata } from "next";
import Link from "next/link";
import { primaryButton } from "@/components/ui";
import { getInterviewViews } from "@/lib/content/interview";
import { InterviewList } from "./interview-list";

export const metadata: Metadata = {
  title: "AI interview questions with answers",
  description:
    "GenAI engineer interview questions with short and deeper answers, follow-ups and common mistakes: LLM basics, RAG, agents, evals and system design.",
};

export default function InterviewPage() {
  const questions = getInterviewViews();
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">Interview questions</h1>
      <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
        Questions GenAI interviews ask, each with a short answer you can say out loud, a deeper answer, the
        follow-ups to expect and the mistakes to avoid. Each one links to the lesson that teaches it.
      </p>
      <Link href="/practice" className={`mt-5 ${primaryButton}`}>
        Practise them
      </Link>
      <div className="mt-8">
        <InterviewList questions={questions} />
      </div>
    </main>
  );
}
