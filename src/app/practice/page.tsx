import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { secondaryButton } from "@/components/ui";
import { Icon } from "@/components/art/icons";
import { getGlossary } from "@/lib/content";
import { getInterviewViews, quizPoolFor } from "@/lib/content/interview";
import { PracticeView } from "./practice-view";

export const metadata: Metadata = {
  alternates: { canonical: "/practice" },
  title: "Practise AI interview questions",
  description: "Practise AI interview questions as flashcards: answer out loud, compare with the model answer, rate yourself and take quick quizzes.",
};

/** Terms learners meet first, shown as a taste of the glossary (only those that exist are shown). */
const STARTER_TERMS = ["token", "embedding", "rag", "hallucination", "fine-tuning", "prompt-engineering", "agent", "vector-database"];

export default function PracticePage() {
  const glossary = getGlossary();
  const ids = new Set(glossary.map((g) => g.id));
  const starters = STARTER_TERMS.filter((id) => ids.has(id)).map((id) => glossary.find((g) => g.id === id)!);
  return (
    <main>
      <PageHero
        size="full" shape="cardFan"
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
          <Link href="/glossary" className={secondaryButton}>
            AI glossary
          </Link>
        </div>
      </PageHero>
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* The glossary was only in the footer; practice is where learners need words explained. */}
        <section aria-labelledby="glossary-heading" className="mb-8 rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-sky-50 p-5 md:p-6 dark:border-violet-900 dark:from-violet-950/40 dark:to-sky-950/30">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-violet-700 text-white">
              <Icon name="book" size={24} />
            </span>
            <div className="min-w-0">
              <h2 id="glossary-heading" className="text-lg font-semibold">
                AI glossary
              </h2>
              <p className="mt-1 leading-7 text-zinc-700 dark:text-zinc-300">
                Stuck on a word in an answer? {glossary.length} AI terms explained in plain words, each linked to the lesson that teaches it.
              </p>
            </div>
          </div>
          {starters.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Popular terms">
              {starters.map((t) => (
                <li key={t.id}>
                  <Link href={`/glossary#${t.id}`} className="inline-flex min-h-11 items-center rounded-full border border-violet-300 bg-white px-3 text-sm font-medium text-violet-900 hover:bg-violet-100 dark:border-violet-800 dark:bg-zinc-900 dark:text-violet-200 dark:hover:bg-violet-950">
                    {t.term}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/glossary" className="mt-4 inline-flex min-h-11 items-center gap-1 font-medium text-violet-800 hover:underline dark:text-violet-300">
            Open the AI glossary →
          </Link>
        </section>
        <PracticeView topic={null} questions={getInterviewViews()} quizPool={quizPoolFor(null)} />
      </div>
    </main>
  );
}
