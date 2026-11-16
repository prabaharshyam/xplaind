import Link from "next/link";
import { Words } from "@/components/motion/words";
import { getContent, getTranslation } from "@/lib/content";
import { LESSON_LANGS } from "@/lib/content/schema";

/** The lesson shown as the sample in every language: the first one a new learner opens. */
const SAMPLE_ID = "what-is-ai";

/**
 * LT-2: the "learn in your language" selling point on the home page. Each card shows the real
 * title of one lesson in that language and opens it, so a visitor sees the language before they
 * commit. Counts come from the translation files, so they never drift from what is on the site.
 * Hidden if the sample lesson has no translations at all.
 */
export function LanguagesSection() {
  const translations = getContent().translations;
  const cards = LESSON_LANGS.map((l) => ({
    ...l,
    title: getTranslation(SAMPLE_ID, l.id)?.title,
    lessons: translations.filter((t) => t.data.lang === l.id).length,
  })).filter((c) => c.title && c.lessons > 0);
  if (cards.length === 0) return null;

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
        </div>
        <ul data-rise-group className="grid gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <li key={c.id} data-rise>
              <Link
                href={`/stop/${SAMPLE_ID}/${c.id}`}
                hrefLang={c.htmlLang}
                className="flex h-full min-h-11 flex-col rounded-2xl border border-zinc-200 bg-white p-5 hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
              >
                <span lang={c.htmlLang} className="text-2xl font-semibold tracking-tight">
                  {c.label}
                </span>
                <span lang={c.htmlLang} className="mt-3 text-base leading-7 text-zinc-800 dark:text-zinc-200">
                  {c.title}
                </span>
                <span className="mt-auto pt-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="sr-only">{c.name}: </span>
                  {c.lessons} lessons
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
