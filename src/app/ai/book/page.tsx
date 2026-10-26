import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { aiEnabled } from "@/lib/ai/settings";
import { BookStudio } from "./book-studio";

export const metadata: Metadata = {
  title: "Ask me from my book: MCQ tests from your own PDF",
  description:
    "Upload your textbook or notes, pick chapters, difficulty, number of questions and time, and take a timed MCQ test written from your book. The report quotes the page for every answer and shows what to reread.",
  alternates: { canonical: "/ai/book" },
};

/** MB-1 to MB-4: "Ask me from my book". The book is read in the browser and never stored. */
export default function BookPage() {
  return (
    <main>
      <PageHero
        theme="retrieval"
        seed="ask-my-book"
        icon="book"
        eyebrow="Practice · AI tool"
        title="Ask me from my book"
        lead="Upload your book or notes. Choose the chapters, how hard, how many questions and how long. Take a timed test written from your book, then get a report that shows each answer on its page and tells you what to reread."
        crumbs={[{ href: "/practice", label: "Practice" }]}
      />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <BookStudio aiOn={aiEnabled()} />
      </div>
    </main>
  );
}
