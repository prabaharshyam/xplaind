import Link from "next/link";
import { BookCard } from "@/components/book-card";
import { PageHero } from "@/components/page-hero";
import { textLink } from "@/components/ui";
import { getContent } from "@/lib/content";
import { sortBooks } from "@/lib/roadmap/books-order";
import { pageMeta } from "@/lib/seo";
import { THEMES } from "@/lib/themes";

export const metadata = pageMeta({
  title: "Best books on AI, ML, DSA and system design",
  description:
    "Hand-picked books on AI, machine learning, LLMs and RAG, data structures and algorithms, and system design, sorted by topic and level to help India learn AI faster.",
  path: "/books",
});

/** BK-1: the books page, grouped by topic. Order comes from the editor's score (ED-2). */
export default function BooksPage() {
  const books = sortBooks(getContent().books.map((b) => b.data));
  // Each book appears once, under its first topic.
  const groups = THEMES.map((t) => ({ theme: t, books: books.filter((b) => b.themes[0] === t.id) })).filter((g) => g.books.length);
  return (
    <main>
      <PageHero shape="bookshelf"
        theme="ai-basics"
        seed="books"
        icon="book"
        eyebrow="Books"
        title="Books worth reading"
        lead={`${books.length} books we recommend for learning AI, from your first read to the textbooks professionals keep on their desk. Grouped by topic, best first.`}
      />
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          The buy links are Amazon India affiliate links: if you buy, we may earn a small commission at no extra cost to you.
          It never changes which books we pick or their order. <Link href="/disclosure" className={textLink}>Read our disclosure</Link>.
        </p>
        <nav aria-label="Book topics" className="mt-6 flex flex-wrap gap-2">
          {groups.map((g) => (
            <a key={g.theme.id} href={`#${g.theme.id}`} className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900">
              {g.theme.label} ({g.books.length})
            </a>
          ))}
        </nav>
        {groups.map((g) => (
          <section key={g.theme.id} id={g.theme.id} aria-labelledby={`${g.theme.id}-h`} className="mt-10 scroll-mt-24">
            <h2 id={`${g.theme.id}-h`} className="text-2xl font-semibold tracking-tight">
              {g.theme.label}
            </h2>
            <ul className="mt-4 flex flex-col gap-4">
              {g.books.map((b) => (
                <li key={b.id}>
                  <BookCard book={b} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
