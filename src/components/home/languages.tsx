import Link from "next/link";
import { Words } from "@/components/motion/words";
import { getContent, getStop, getTranslation } from "@/lib/content";
import { LESSON_LANGS } from "@/lib/content/schema";

/** The lesson shown as the sample in every language: the first one a new learner opens. */
const SAMPLE_ID = "what-is-ai";
/** The question from that lesson's flashcards shown in every language: one a learner has really wondered about. */
const SAMPLE_QUESTION = /hallucination/i;

/**
 * LT-2: the "learn in your language" selling point on the home page. It takes one real question from
 * the first lesson ("What is a hallucination?") and shows its answer in English and then in each
 * language, so a visitor sees the same idea explained four ways before they commit. Each card opens the
 * lesson in that language. Counts come from the translation files, so they never drift from what is
 * on the site. Hidden if the sample has no translations at all.
 */
export function LanguagesSection() {
  const translations = getContent().translations;
  const english = getStop(SAMPLE_ID)?.flashcards ?? [];
  const at = english.findIndex((f) => SAMPLE_QUESTION.test(f.q)); // the same position in every translation
  const sample = at >= 0 ? english[at] : undefined;
  const cards = LESSON_LANGS.map((l) => {
    const card = at >= 0 ? getTranslation(SAMPLE_ID, l.id)?.flashcards?.[at] : undefined;
    return { ...l, q: card?.q, a: card?.a, lessons: translations.filter((t) => t.data.lang === l.id).length };
  }).filter((c) => c.q && c.a && c.lessons > 0);
  if (!sample || cards.length === 0) return null;

  return (
    <section id="languages" aria-labelledby="languages-heading" className="py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-[1fr_1.3fr] md:items-center md:gap-14 md:px-6">
        <div>
          <p className="font-mono text-sm text-zinc-600 dark:text-zinc-400">Your language</p>
          <h2 id="languages-heading" data-words className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            <Words text="Learn AI in the language you think in" />
          </h2>
          <p className="mt-4 max-w-md text-lg leading-8 text-zinc-700 dark:text-zinc-300">
            Every lesson also comes in everyday Tamil and Hindi, and in Tanglish and Hinglish if you read faster in English letters. Technical terms stay in English, as they do at work.
          </p>
          <div className="mt-6 max-w-md rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="text-xs font-semibold tracking-[0.12em] text-zinc-600 dark:text-zinc-400">THE SAME IDEA, IN ENGLISH</p>
            <p lang="en" className="mt-3 text-lg font-semibold">
              {sample.q}
            </p>
            <p lang="en" className="mt-1 leading-7 text-zinc-800 dark:text-zinc-200">
              {sample.a}
            </p>
          </div>
        </div>
        <ul data-rise-group className="grid gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <li key={c.id} data-rise>
              <Link
                href={`/stop/${SAMPLE_ID}/${c.id}`}
                hrefLang={c.htmlLang}
                className="flex h-full min-h-11 flex-col rounded-2xl border border-zinc-200 bg-white p-5 hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
              >
                <span lang={c.htmlLang} className="text-sm font-semibold tracking-wide text-brand-800 dark:text-brand-300">
                  {c.label}
                </span>
                <span lang={c.htmlLang} className="mt-2 text-lg leading-7 font-semibold tracking-tight">
                  {c.q}
                </span>
                <span lang={c.htmlLang} className="mt-2 text-base leading-7 text-zinc-800 dark:text-zinc-200">
                  {c.a}
                </span>
                <span className="mt-auto pt-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="sr-only">{c.name}: </span>
                  Read all {c.lessons} lessons in {c.label} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
