import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { secondaryButton } from "@/components/ui";
import { getInterviewViews, quizPoolFor } from "@/lib/content/interview";
import { PracticeView } from "./practice-view";

export const metadata: Metadata = {
  title: "Practise AI interview questions",
  description: "Practise GenAI interview questions one at a time, rate yourself, and take quick multiple-choice quizzes.",
};

export default function PracticePage() {
  return (
    <main>
      <PageHero
        theme="evals"
        seed="practice"
        icon="check"
        eyebrow="Interview prep"
        title="Practice"
        lead="Flashcards for interview questions: answer out loud, check yourself and rate it. Questions you miss come back first. Every rating earns XP."
      >
        {/* The question bank lost its place in the top bar, so it is one tap from here. */}
        <div className="flex flex-wrap gap-2">
          <Link href="/interview" className={secondaryButton}>
            Browse all {getInterviewViews().length} interview questions
          </Link>
          <Link href="/interview/simulator" className={secondaryButton}>
            Take a mock interview
          </Link>
          <Link href="/ai/book" className={secondaryButton}>
            Ask me from my book
          </Link>
        </div>
      </PageHero>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <PracticeView topic={null} questions={getInterviewViews()} quizPool={quizPoolFor(null)} />
      </div>
    </main>
  );
}
