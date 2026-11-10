import type { Metadata } from "next";
import { inSentence, pageMeta, titleCase } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonCard } from "@/components/lesson-card";
import { PageHero } from "@/components/page-hero";
import { textLink } from "@/components/ui";
import { BookCard } from "@/components/book-card";
import { getContent, getPaths, getStops } from "@/lib/content";
import { booksForTheme } from "@/lib/roadmap/books-order";
import { getInterviewViews } from "@/lib/content/interview";
import { LEVEL_IDS } from "@/lib/levels";
import { THEMES, themeOf } from "@/lib/themes";

export function generateStaticParams() {
  return THEMES.map((t) => ({ theme: t.id }));
}

const lessonsOf = (theme: string) =>
  getStops()
    .filter((s) => s.theme === theme)
    .sort((a, b) => LEVEL_IDS.indexOf(a.level) - LEVEL_IDS.indexOf(b.level) || a.title.localeCompare(b.title));

export async function generateMetadata({ params }: PageProps<"/topics/[theme]">): Promise<Metadata> {
  const id = (await params).theme;
  if (!THEMES.some((t) => t.id === id)) return {};
  const t = themeOf(id);
  const lessons = lessonsOf(id);
  // SE-8: "<topic> tutorial for beginners", "learn <topic> free".
  return pageMeta({
    title: [`${titleCase(t.label)} Tutorial for Beginners: ${lessons.length} Lessons`, `${titleCase(t.label)} Tutorial: ${lessons.length} Lessons`, `Learn ${titleCase(t.label)}`, titleCase(t.label)],
    description: `Learn ${inSentence(t.label)} from scratch: ${lessons.length} short plain-English lessons in order, from ${lessons[0]?.title ?? ""} onwards, each with the best course, a quiz and interview questions.`,
    path: `/topics/${id}`,
  });
}

/** One topic: its lessons from easiest to hardest, the roadmaps that use them, and interview questions. */
export default async function TopicPage({ params }: PageProps<"/topics/[theme]">) {
  const id = (await params).theme;
  if (!THEMES.some((t) => t.id === id)) notFound();
  const t = themeOf(id);
  const lessons = lessonsOf(id);
  const ids = new Set(lessons.map((l) => l.id));
  const paths = getPaths().filter((p) => p.stages.some((st) => st.lessons.some((l) => ids.has(l))));
  const questions = getInterviewViews().filter((q) => ids.has(q.stop.id)).slice(0, 8);
  const hours = lessons.reduce((n, l) => n + l.hours, 0);
  // BK-4: the best books for this topic (ED-2: by the editor's score, never by commission).
  const books = booksForTheme(getContent().books.map((b) => b.data), id, 4);

  return (
    <main>
      <PageHero
        theme={t.id}
        seed={`topic-${t.id}`}
        eyebrow="Topic roadmap"
        title={t.label}
        lead={`${lessons.length} lessons, about ${hours} hours in all, from the basics to advanced. Start with the first, or jump to what you need.`}
        crumbs={[{ href: "/topics", label: "Topics" }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <h2 className="text-2xl font-semibold">Lessons, easiest first</h2>
        <ol className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((l) => (
            <li key={l.id}>
              <LessonCard l={l} />
            </li>
          ))}
        </ol>

        {paths.length > 0 && (
          <section aria-labelledby="on-roadmaps" className="mt-12">
            <h2 id="on-roadmaps" className="text-2xl font-semibold">
              On these role roadmaps
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {paths.map((p) => (
                <li key={p.id}>
                  <Link href={`/roadmap/${p.id}`} className="inline-flex min-h-11 items-center rounded-full border border-zinc-300 px-4 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {questions.length > 0 && (
          <section aria-labelledby="questions" className="mt-12">
            <h2 id="questions" className="text-2xl font-semibold">
              Interview questions on {t.label.toLowerCase()}
            </h2>
            <ul className="mt-4 flex flex-col gap-2">
              {questions.map((q) => (
                <li key={q.id}>
                  <Link href={`/interview/${q.id}`} className={textLink}>
                    {q.question}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {books.length > 0 && (
          <section aria-labelledby="books" className="mt-12">
            <h2 id="books" className="text-2xl font-semibold">
              Books on {t.label.toLowerCase()}
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {books.map((b) => (
                <li key={b.id}>
                  <BookCard book={b} compact />
                </li>
              ))}
            </ul>
            <p className="mt-3">
              <Link href="/books" className={textLink}>
                All recommended books
              </Link>
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
