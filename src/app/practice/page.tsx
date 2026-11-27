import { pageMeta } from "@/lib/seo";
import { ExploreTools } from "@/components/explore-tools";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { secondaryButton } from "@/components/ui";
import { getInterviewViews, quizPoolFor } from "@/lib/content/interview";
import { PracticeView } from "./practice-view";

export const metadata: Metadata = pageMeta({
  // SE-8: search-led title and description.
  title: ["AI Interview Questions Practice: Flashcards & Quizzes", "AI Interview Practice: Flashcards"],
  description:
    "Practise AI interview questions until you can answer out loud: flashcards and quizzes on LLMs, RAG, agents, ML and system design. Answer out loud, then check the model answer.",
  path: "/practice",
});

export default function PracticePage() {
  return (
    <main>
      {/* SE-11 (2026-11-18, site review): the cards come first. A compact header, and the other ways to
          practise below them, so "Start practicing" is on the first screen of a phone. */}
      <PageHero
        theme="evals"
        seed="practice"
        icon="check"
        eyebrow="Interview prep"
        title="Practice"
        lead="Flashcards for interview questions: answer out loud, check yourself and rate it. Questions you miss come back first."
      />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <PracticeView topic={null} questions={getInterviewViews()} quizPool={quizPoolFor(null)} />
        <section aria-labelledby="more-practice" className="mt-12">
          <h2 id="more-practice" className="text-xl font-semibold">
            More ways to practise
          </h2>
          {/* The question bank lost its place in the top bar, so it is one tap from here. */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/interview" className={secondaryButton}>
              Browse all {getInterviewViews().length} interview questions
            </Link>
            <Link href="/interview/simulator" className={secondaryButton}>
              Take a mock interview
            </Link>
            <Link href="/ai/book" className={secondaryButton}>
              Study from my notes & books
            </Link>
          </div>
        </section>
      </div>
      <ExploreTools current="/practice" />
    </main>
  );
}
