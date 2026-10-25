import type { Metadata } from "next";
import Link from "next/link";
import { DraftNote } from "@/components/draft-note";
import { muted, textLink } from "@/components/ui";
import { getGlossary, lessonsWithTerm } from "@/lib/content";

export const metadata: Metadata = {
  title: "AI glossary",
  description: "Plain-English meanings of the AI terms you will meet, from tokens to agents, each linked to the lesson that teaches it.",
};

const letterOf = (term: string) => (/^[a-z]/i.test(term) ? term[0].toUpperCase() : "#");

export default function GlossaryPage() {
  const terms = getGlossary();
  const names = new Map(terms.map((t) => [t.id, t.term]));
  const letters = [...new Set(terms.map((t) => letterOf(t.term)))];

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">AI glossary</h1>
      <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
        {terms.length} terms in plain words. Each links to the lessons that teach it.
      </p>
      <div className="mt-4">
        <DraftNote />
      </div>

      <nav aria-label="Letters" className="mt-6">
        <ol className="flex flex-wrap gap-1.5">
          {letters.map((l) => (
            <li key={l}>
              <a
                href={`#letter-${l}`}
                className="flex size-11 items-center justify-center rounded-lg border border-zinc-300 font-semibold hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-700 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                {l}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {letters.map((l) => (
        <section key={l} aria-labelledby={`letter-${l}`} className="mt-10">
          <h2 id={`letter-${l}`} className="scroll-mt-20 text-2xl font-semibold">
            {l}
          </h2>
          <dl className="mt-4 flex flex-col gap-6">
            {terms
              .filter((t) => letterOf(t.term) === l)
              .map((t) => {
                const lessons = lessonsWithTerm(t.id);
                return (
                  <div key={t.id} id={t.id} className="scroll-mt-20">
                    <dt className="text-lg font-semibold">
                      {t.term}
                      {t.also.length > 0 && <span className={`text-sm font-normal ${muted}`}> (also: {t.also.join(", ")})</span>}
                    </dt>
                    <dd className="mt-1 leading-7">{t.definition}</dd>
                    {t.explanation && <dd className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">{t.explanation}</dd>}
                    {lessons.length > 0 && (
                      <dd className="mt-2 text-sm">
                        Learn it in:{" "}
                        {lessons.map((s, i) => (
                          <span key={s.id}>
                            {i > 0 && ", "}
                            <Link href={`/stop/${s.id}`} className={textLink}>
                              {s.title}
                            </Link>
                          </span>
                        ))}
                      </dd>
                    )}
                    {t.related.length > 0 && (
                      <dd className={`mt-1 text-sm ${muted}`}>
                        Related:{" "}
                        {t.related.map((r, i) => (
                          <span key={r}>
                            {i > 0 && ", "}
                            <a href={`#${r}`} className={textLink}>
                              {names.get(r)}
                            </a>
                          </span>
                        ))}
                      </dd>
                    )}
                  </div>
                );
              })}
          </dl>
        </section>
      ))}
    </main>
  );
}
