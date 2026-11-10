import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { aiEnabled } from "@/lib/ai/settings";
import { BookStudio } from "./book-studio";

export const metadata: Metadata = pageMeta({
  // SE-8: search-led title and description.
  title: ["Study From Your Notes: AI Tests & Flashcards From a PDF", "AI Tests & Flashcards From Your PDF"],
  description:
    "Upload your textbook or notes as a PDF or Word file and get a timed MCQ test or flashcards written from it. Every answer cites its page.",
  path: "/ai/book",
});

/** MB-1 to MB-5: "Study from my notes & books" (renamed from "Ask me from my book" on 2026-11-06). The book is read in the browser and never stored. */
export default function BookPage() {
  return (
    <main>
      <PageHero shape="openBook"
        theme="retrieval"
        seed="ask-my-book"
        icon="book"
        eyebrow="Practice · AI tool"
        title="Study from my notes & books"
        lead="Upload your book or notes as a PDF or Word file. Get a timed test or a deck of flashcards written from it. Every answer shows the page it came from, and the report tells you what to reread."
        crumbs={[{ href: "/practice", label: "Practice" }]}
      />
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* AG-1: needs an account once sign-ups are open; while they are on hold, guests keep their limits (SU-5). */}
        <BookStudio aiOn={aiEnabled()} />
      </div>
    </main>
  );
}
