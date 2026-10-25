import type { Metadata } from "next";
import { getInterviewViews, quizPoolFor } from "@/lib/content/interview";
import { PracticeView } from "./practice-view";

export const metadata: Metadata = {
  title: "Practise AI interview questions",
  description: "Practise GenAI interview questions one at a time, rate yourself, and take quick multiple-choice quizzes.",
};

export default function PracticePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Practice</h1>
      <p className="mt-3 mb-8 leading-7 text-zinc-700 dark:text-zinc-300">
        Answer out loud, check yourself, and be honest with the rating. Questions you miss come back first.
      </p>
      <PracticeView topic={null} questions={getInterviewViews()} quizPool={quizPoolFor(null)} />
    </main>
  );
}
