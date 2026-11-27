import { Words } from "@/components/motion/words";
import { getContent, getStop, getTranslation } from "@/lib/content";
import { LESSON_LANGS } from "@/lib/content/schema";
import { LanguageSample, type LanguageCard } from "./language-sample";

/** The lesson shown as the sample in every language: the first one a new learner opens. */
const SAMPLE_ID = "what-is-ai";
/** The question from that lesson's flashcards shown in every language: one a learner has really wondered about. */
const SAMPLE_QUESTION = /hallucination/i;

/**
 * LT-2: the "learn in your language" selling point on the home page. It takes one real question from
 * the first lesson ("What is a hallucination?") and shows its answer in each language, one at a time
 * (LT-5), with a link to that language's lessons. Counts come from the translation files, so they never
 * drift from what is on the site. Hidden if the sample has no translations at all.
 */
export function LanguagesSection() {
  const translations = getContent().translations;
  const english = getStop(SAMPLE_ID)?.flashcards ?? [];
  const at = english.findIndex((f) => SAMPLE_QUESTION.test(f.q)); // the same position in every translation
  const sample = at >= 0 ? english[at] : undefined;
  const lessons = getContent().stops.length;
  const cards: LanguageCard[] = LESSON_LANGS.map((l) => {
    const card = at >= 0 ? getTranslation(SAMPLE_ID, l.id)?.flashcards?.[at] : undefined;
    return { id: l.id, label: l.label, htmlLang: l.htmlLang, q: card?.q ?? "", a: card?.a ?? "", href: `/stop/${SAMPLE_ID}/${l.id}`, lessons: translations.filter((t) => t.data.lang === l.id).length };
  }).filter((c) => c.q && c.a && c.lessons > 0);
  if (!sample || cards.length === 0) return null;
  const inEnglish: LanguageCard = { id: "en", label: "English", htmlLang: "en", q: sample.q, a: sample.a, href: `/stop/${SAMPLE_ID}`, lessons };

  return (
    <section id="languages" aria-labelledby="languages-heading" className="py-10 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-[1fr_1.3fr] md:items-start md:gap-14 md:px-6">
        <div>
          <h2 id="languages-heading" data-words className="text-3xl font-semibold tracking-tight md:text-4xl">
            <Words text="Learn AI in the language you think in" />
          </h2>
          <p className="mt-4 max-w-md text-lg leading-8 text-zinc-700 dark:text-zinc-300">
            Every lesson also comes in everyday Tamil and Hindi, and in Tanglish and Hinglish if you read faster in English letters. Technical terms stay in English, as they do at work.
          </p>
        </div>
        <LanguageSample cards={[inEnglish, ...cards]} />
      </div>
    </section>
  );
}
