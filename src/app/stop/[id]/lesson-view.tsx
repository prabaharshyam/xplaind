import { ReadingProgress } from "@/components/reading-progress";
import Link from "next/link";
import { ContentGate } from "@/components/account/content-gate";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { RunnableCode } from "@/components/playground/runnable-code";
import remarkGfm from "remark-gfm";
import { muted, textLink } from "@/components/ui";
import { GENAI_PATH_ID, getContent, getGlossary, getLevel, getStop, getStops, getTranslation, pathLessons, pathsWithLesson, translationLangs } from "@/lib/content";
import { LESSON_LANGS, type LessonLang } from "@/lib/content/schema";
import { LessonLanguages } from "./lesson-languages";
import { Cover } from "@/components/art/cover";
import { Icon } from "@/components/art/icons";
import { ParticleScene } from "@/components/three/particle-scene";
import { THEME_SHAPE } from "@/components/three/particle-shapes";
import { type IconName, themeOf } from "@/lib/themes";
import { LessonNav, type SectionLink } from "./lesson-nav";
import { LearnPanel } from "./learn-panel";
import { BookCard } from "@/components/book-card";
import { booksForTheme } from "@/lib/roadmap/books-order";
import { LessonVisit } from "@/components/continue-card";
import { JsonLd } from "@/components/json-ld";
import { lessonGraph } from "@/lib/content/structured";
import { StopResources } from "./stop-resources";
import { roadmapHref } from "@/lib/paths";
import { resourceCard } from "@/lib/content/cards";
import { getInterviewViews } from "@/lib/content/interview";
import type { CheckQuestionView } from "./stop-progress";
import { StopProgressPanel } from "./stop-progress";
import { LessonTutor } from "./lesson-tutor";
import { LessonExercise } from "./lesson-exercise";
import { type LessonRoadmap, LessonRoadmapProvider, RoadmapCrumbs, RoadmapLessons, RoadmapPrevNext } from "./lesson-roadmap";
import { Flashcards } from "@/components/flashcards";
import { TopicStatus } from "@/components/roadmap/topic-status";
import { aiEnabled } from "@/lib/ai/settings";
import { levelWords } from "@/lib/levels";
import { CopyCode } from "@/components/copy-code";
import { FlowDiagram } from "@/components/flow-diagram";
import { runsInBrowser } from "@/lib/playground/runs-in-browser";

/** Lesson text: headings, lists, code and tables styled without a typography plugin. Code scrolls inside its box at 360px. */
const PROSE =
  "mt-2 leading-7 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:font-semibold [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_strong]:font-semibold [&_blockquote]:mt-3 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-700 dark:[&_blockquote]:border-zinc-700 dark:[&_blockquote]:text-zinc-300 [&_pre]:mt-3 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-zinc-100 [&_pre]:p-3 [&_pre]:text-sm dark:[&_pre]:bg-zinc-900 [&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-zinc-100 [&_:not(pre)>code]:px-1 dark:[&_:not(pre)>code]:bg-zinc-900 [&_table]:mt-3 [&_table]:block [&_table]:overflow-x-auto [&_td]:border [&_td]:border-zinc-300 [&_td]:p-2 [&_th]:border [&_th]:border-zinc-300 [&_th]:p-2 [&_th]:text-left dark:[&_td]:border-zinc-700 dark:[&_th]:border-zinc-700 [&_table]:w-full [&_table]:border-collapse [&_th]:bg-zinc-100 dark:[&_th]:bg-zinc-900 [&_pre:has(>code.language-text)]:border [&_pre:has(>code.language-text)]:border-zinc-200 [&_pre:has(>code.language-text)]:bg-zinc-50 [&_pre:has(>code.language-text)]:p-4 [&_pre:has(>code.language-text)]:leading-6 [&_pre:has(>code.language-text)]:text-zinc-800 dark:[&_pre:has(>code.language-text)]:border-zinc-800 dark:[&_pre:has(>code.language-text)]:bg-zinc-950 dark:[&_pre:has(>code.language-text)]:text-zinc-200";

/** Code blocks and tables scroll sideways on phones, so keyboard users must be able to focus them (WCAG 2.1.1). */
/** PG-4: Python examples in lessons get a "Run this code" button; other code stays as it is. */
function LessonPre(props: React.ComponentProps<"pre">) {
  const child = props.children as React.ReactElement<{ className?: string; children?: unknown }> | undefined;
  const lang = child?.props?.className ?? "";
  const text = typeof child?.props?.children === "string" ? child.props.children : null;
  // RM-14: a ```flow block is a diagram, drawn as SVG.
  if (/\blanguage-flow\b/.test(lang) && text) return <FlowDiagram source={text} />;
  // Text blocks (language-text) are program output and logs: no Copy button on those.
  const pre = /\blanguage-text\b/.test(lang) ? <pre tabIndex={0} {...props} /> : <CopyCode><pre tabIndex={0} {...props} className={`${props.className ?? ""} pr-16`} /></CopyCode>;
  // PG-6: only code whose imports Pyodide can load gets the button; the rest stays copyable.
  if (!text || !/\blanguage-(python|py)\b/.test(lang) || !runsInBrowser(text)) return pre;
  return (
    <RunnableCode code={text.replace(/\n$/, "")} aiOn={aiEnabled()}>
      {pre}
    </RunnableCode>
  );
}

const MDX_COMPONENTS = {
  pre: LessonPre,
  table: (props: React.ComponentProps<"table">) => <table tabIndex={0} {...props} />,
};
const MDX_OPTIONS = { mdxOptions: { remarkPlugins: [remarkGfm] } };

const SECTION_ICON: Record<string, IconName> = {
  "What it is": "compass",
  "How it works": "flow",
  "A worked example": "play",
  "Common mistakes": "shield",
  Practice: "target",
};
/** 2026-11-06, owner request: every lesson section is the same plain white card with a soft shadow. */
const CARD = "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.03] md:p-6 dark:border-zinc-800 dark:bg-zinc-900";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** An explainer's body split at its level-2 headings, so each part gets its own card. */
function splitSections(body: string): { title: string; body: string }[] {
  return body
    .split(/^## /m)
    .slice(1)
    .map((chunk) => {
      const nl = chunk.indexOf("\n");
      return { title: chunk.slice(0, nl).trim(), body: chunk.slice(nl + 1).trim() };
    });
}

/** LT-1: words around the lesson that change with its language. */
const LABELS = {
  en: { answer: "Quick answer", why: "Why it matters", cards: "Test your understanding", part: (i: number, n: number) => `Part ${i} of ${n}` },
  ta: { answer: "சுருக்கமா சொன்னா", why: "இது ஏன் முக்கியம்", cards: "உங்க understanding-ஐ test பண்ணுங்க", part: (i: number, n: number) => `Part ${i} / ${n}` },
  hi: { answer: "सीधा जवाब", why: "ये क्यों ज़रूरी है", cards: "अपनी समझ test करो", part: (i: number, n: number) => `Part ${i} / ${n}` },
  tanglish: { answer: "Short-aa sonna", why: "Idhu yen mukkiyam", cards: "Unga understanding-a test pannunga", part: (i: number, n: number) => `Part ${i} / ${n}` },
  hinglish: { answer: "Seedha jawab", why: "Ye kyun zaroori hai", cards: "Apni samajh test karo", part: (i: number, n: number) => `Part ${i} / ${n}` },
} as const;

/** The lesson page, in English or (LT-1) one of its translations. */
export async function LessonView({ id, lang = "en" }: { id: string; lang?: "en" | LessonLang }) {
  const english = getStop(id);
  if (!english) notFound();
  const tr = lang === "en" ? undefined : getTranslation(id, lang);
  if (lang !== "en" && !tr) notFound();
  // A translation replaces the words; everything else (videos, courses, the quick check) is shared.
  const stop = tr
    ? { ...english, title: tr.title, outcome: tr.outcome, answer: tr.answer, why_it_matters: tr.why_it_matters, flashcards: tr.flashcards, exercise: tr.exercise, ask: tr.ask.length ? tr.ask : english.ask, body: tr.body }
    : english;
  const L = LABELS[lang];
  const langs = translationLangs(id);
  // Section ids and icons come from the English headings, so links and icons match in every language.
  const enSections = splitSections(english.body);
  const sectionKey = (i: number, title: string) => enSections[i]?.title ?? title;

  const level = getLevel(stop.level);
  const paths = pathsWithLesson(stop.id);
  const terms = stop.key_terms.map((id) => getGlossary().find((g) => g.id === id)!);
  const explainer = stop.format !== "brief";
  const interview = getInterviewViews().filter((q) => q.stop.id === stop.id);
  const cards = [stop.primary_resource, ...stop.alternates].map(resourceCard);
  const more = stop.more.map(resourceCard);
  // RM-4: the Watch & learn panel holds only videos and, after them, video courses (VD-2); other courses and articles get full cards after the text.
  const isVideo = (c: (typeof cards)[number]) => Boolean(c.embed) || /video/i.test(c.kindLabel);
  const learn = [...stop.videos.map(resourceCard), ...cards, ...more].filter(isVideo).sort((a, b) => Number(a.kindLabel === "Video course") - Number(b.kindLabel === "Video course"));
  const courses = [...cards, ...more].filter((c) => !isVideo(c));
  // BK-4: up to two books for the lesson's topic, best first (ED-2: never by commission).
  const books = booksForTheme(getContent().books.map((b) => b.data), stop.theme, 2);
  const checks = new Map(getContent().checks.map(({ data: q }) => [q.id, q]));
  const check =
    stop.check.type === "project"
      ? { type: "project" as const, brief: stop.check.brief }
      : {
          type: "mcq" as const,
          questions: stop.check.question_ids.map((id): CheckQuestionView => {
            const q = checks.get(id)!;
            return { id: q.id, stem: q.stem, options: q.options, correct: q.correct, explanation: q.explanation };
          }),
        };

  const theme = themeOf(stop.theme);
  const sections = explainer ? splitSections(stop.body) : [];
  const navSections: SectionLink[] = [
    { id: "why", title: L.why, icon: "star" },
    ...sections.map((sec, i) => ({ id: slug(sectionKey(i, sec.title)), title: sec.title, icon: SECTION_ICON[sectionKey(i, sec.title)] ?? ("book" as const) })),
    ...(stop.exercise ? [{ id: "try-it", title: stop.exercise.title, icon: "bolt" as const }] : []),
    ...(stop.flashcards.length ? [{ id: "flashcards", title: L.cards, icon: "check" as const }] : []),
    ...(courses.length ? [{ id: "courses", title: "Best course", icon: "book" as const }] : []),
    ...(books.length ? [{ id: "books", title: "Books", icon: "book" as const }] : []),
    { id: "check", title: "Quick check", icon: "check" },
    { id: "tutor", title: "Ask the AI tutor", icon: "sparkles" },
  ];
  // RM-16: every roadmap this lesson is on; the page follows the one the learner came from.
  const roadmaps: LessonRoadmap[] = paths.map((p) => ({
    id: p.id,
    name: p.name,
    href: roadmapHref(p.id),
    lessons: pathLessons(p.id).map((l) => l.id),
    crumbs:
      p.id === GENAI_PATH_ID
        ? [
            { href: roadmapHref(GENAI_PATH_ID), label: "Roadmap" },
            { href: `/roadmap/genai-engineer/${stop.level.toLowerCase()}`, label: `${levelWords(stop.level)}: ${level?.name ?? ""}` },
          ]
        : undefined,
  }));
  const titles = Object.fromEntries(getStops().filter((s) => roadmaps.some((r) => r.lessons.includes(s.id))).map((s) => [s.id, s.title]));

  return (
    <LessonRoadmapProvider roadmaps={roadmaps} titles={titles} current={stop.id}>
    <main lang={lang === "en" ? undefined : LESSON_LANGS.find((l) => l.id === lang)?.htmlLang}>
      {/* MO-2: a reading-progress bar under the top bar. */}
      <ReadingProgress />
      <LessonVisit stopId={stop.id} />
      {lang === "en" && <JsonLd data={lessonGraph(stop, paths)} />}
      {/* A11Y-1: the light end of a topic's colours is blended in only a third of the way, and a dark layer sits
          over the art, so white text keeps at least 4.5:1 contrast on every topic. */}
      <header className="relative overflow-hidden text-white" style={{ background: "linear-gradient(135deg, #0a2e33, #0e4a50)" }}>
        <Cover theme={stop.theme} seed={stop.id} plain className="absolute inset-0 opacity-60" />
        <div aria-hidden="true" className="absolute inset-0 bg-black/[0.22]" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-end md:justify-between md:px-6 md:py-12">
          <div className="max-w-3xl">
            <nav aria-label="Breadcrumb" className="text-sm text-white/90">
              <RoadmapCrumbs />
              <span> / </span>
              <Link href={`/topics/${theme.id}`} className="underline underline-offset-2">
                {theme.label}
              </Link>
            </nav>
            <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-balance drop-shadow-sm md:text-5xl">{stop.title}</h1>
            <p className="mt-3 text-base leading-7 text-white md:text-lg md:leading-8">{stop.outcome}</p>
            {langs.length > 0 && <LessonLanguages id={stop.id} current={lang} available={langs} />}
            <p className="mt-4 flex flex-wrap gap-2 text-sm">
              {[`${levelWords(stop.level)} · ${level?.name ?? ""}`, `about ${stop.hours} ${stop.hours === 1 ? "hour" : "hours"}`, `${sections.length || 1} sections`].map((c) => (
                <span key={c} className="rounded-full bg-black/35 px-3 py-1">
                  {c}
                </span>
              ))}
            </p>
          </div>
          {/* MO-8: the lesson's topic as a particle sculpture. */}
          {/* White particles: the lesson header is already in the topic's colours. */}
          <ParticleScene shape={THEME_SHAPE[stop.theme]} colors={["#ffffff", "#fdf2f8", "#fef9c3"]} icon={theme.icon} className="hidden h-64 w-96 shrink-0 md:block" />
        </div>
      </header>

      {/* RM-15: "On this page" on the left, the lesson in the middle, videos and the path's lessons on the right. */}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 md:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_260px]">
        <div className="min-w-0">
          <LessonNav sections={navSections} />
        </div>
        <div className="min-w-0 pt-6 lg:pt-10 xl:order-2">
          {/* RM-7: on a big screen the Learning / Done / Skip buttons sit at the top; phones get the bar at the bottom. */}
          <div className="mb-6 hidden flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 lg:flex dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-sm font-medium">Track this topic</span>
            <TopicStatus stopId={stop.id} title={stop.title} label={`Track ${stop.title}`} />
          </div>

          {/* SE-4: the answer first, in plain words, for readers in a hurry and for search and AI results. */}
          <section aria-labelledby="answer-h" className={CARD}>
            <h2 id="answer-h" className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              {L.answer}
            </h2>
            <p className="mt-1 text-lg leading-8 text-zinc-900 dark:text-zinc-100">{stop.answer}</p>
          </section>

          <section id="why" aria-labelledby="why-h" className={`mt-6 scroll-mt-24 ${CARD}`}>
            <h2 id="why-h" className="flex items-center gap-2 text-lg font-semibold">
              {L.why}
            </h2>
            <p className="mt-2 leading-7">{stop.why_it_matters}</p>
          </section>

          {/* CG-1: the quick answer and why it matters are open to everyone; the rest needs a free account. */}
          <ContentGate reason="lesson" title="Sign up free to read the whole lesson" text={`The rest of this lesson: ${sections.length || 1} ${sections.length === 1 ? "part" : "parts"}, video lessons, the best course, practice and a quick check.`}>
          {explainer ? (
            sections.map((sec, i) => (
              <Fragment key={sectionKey(i, sec.title)}>
              <section
                id={slug(sectionKey(i, sec.title))}
                aria-labelledby={`${slug(sectionKey(i, sec.title))}-h`}
                className={`mt-6 scroll-mt-24 ${CARD}`}
              >
                <h2 id={`${slug(sectionKey(i, sec.title))}-h`} className="flex items-center gap-3 text-xl font-semibold">
                  <span className="grid size-9 place-items-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                    <Icon name={SECTION_ICON[sectionKey(i, sec.title)] ?? "book"} size={18} />
                  </span>
                  <span>
                    <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {L.part(i + 1, sections.length)}
                    </span>
                    {sec.title}
                  </span>
                </h2>
                <div className={PROSE}>
                  <MDXRemote source={sec.body} components={MDX_COMPONENTS} options={MDX_OPTIONS} />
                </div>
              </section>
              {/* On phones the videos come once the learner has the idea, after the first part. */}
              {i === 0 && (
                <div className="mt-6 xl:hidden">
                  <LearnPanel stopId={stop.id} items={learn} headingId="learn-top" />
                </div>
              )}
              </Fragment>
            ))
          ) : (
            <section className="mt-6">
              <h2 className="text-xl font-semibold">Do it</h2>
              <div className={PROSE}>
                <MDXRemote source={stop.body} components={MDX_COMPONENTS} options={MDX_OPTIONS} />
              </div>
            </section>
          )}
          {!explainer && (
            <div className="mt-6 xl:hidden">
              <LearnPanel stopId={stop.id} items={learn} headingId="learn-top" />
            </div>
          )}

          {stop.exercise && (
            <section id="try-it" aria-labelledby="try-it-h" className={`mt-6 scroll-mt-24 ${CARD}`}>
              <h2 id="try-it-h" className="flex items-center gap-3 text-xl font-semibold">
                <span className="grid size-9 place-items-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  <Icon name="bolt" size={18} />
                </span>
                {stop.exercise.title}
              </h2>
              <LessonExercise setup={stop.exercise.setup} questions={stop.exercise.questions} />
            </section>
          )}

          {stop.flashcards.length > 0 && (
            <div id="flashcards" className="mt-6 scroll-mt-24">
              <Flashcards cards={stop.flashcards} storageKey={`xplaind.cards.${stop.id}${lang === "en" ? "" : `.${lang}`}`} />
            </div>
          )}

          {terms.length > 0 && (
            <section aria-labelledby="terms-heading" className={`mt-6 ${CARD}`}>
              <h2 id="terms-heading" className="text-xl font-semibold">
                Key terms
              </h2>
              <p className={`mt-1 text-sm ${muted}`}>Tap a term to see what it means.</p>
              <div className="mt-3 flex flex-col gap-2">
                {terms.map((t) => (
                  <details key={t.id} className="group rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-medium [&::-webkit-details-marker]:hidden">
                      {t.term}
                      <span aria-hidden="true" className="transition group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-2 leading-7">{t.definition}</p>
                    <Link href={`/glossary#${t.id}`} className={`mt-1 inline-block text-sm ${textLink}`}>
                      More in the glossary
                    </Link>
                  </details>
                ))}
              </div>
            </section>
          )}

{courses.length > 0 && (
            <section id="courses" aria-labelledby="courses-h" className="mt-8 scroll-mt-24">
              <h2 id="courses-h" className="text-xl font-semibold">
                {explainer ? "Go deeper: the best course" : "Learn it"}
              </h2>
              <StopResources stopId={stop.id} cards={courses} />
            </section>
          )}

          {books.length > 0 && (
            <section id="books" aria-labelledby="books-h" className="mt-8 scroll-mt-24">
              <h2 id="books-h" className="text-xl font-semibold">
                Books on this topic
              </h2>
              <ul className="mt-3 flex flex-col gap-3">
                {books.map((b) => (
                  <li key={b.id}>
                    <BookCard book={b} compact />
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm">
                <Link href="/books" className={textLink}>
                  All recommended books
                </Link>
              </p>
            </section>
          )}

          <section id="check" aria-labelledby="check-h" className={`mt-8 scroll-mt-24 ${CARD}`}>
            <h2 id="check-h" className="flex flex-wrap items-center gap-3 text-xl font-semibold">
              <Icon name="check" size={22} className="text-emerald-700 dark:text-emerald-400" /> Check
            </h2>
            <StopProgressPanel stopId={stop.id} title={stop.title} check={check} />
          </section>

          <section id="tutor" aria-labelledby="tutor-h" className={`mt-8 scroll-mt-24 ${CARD}`}>
            <h2 id="tutor-h" className="flex items-center gap-2 text-xl font-semibold">
              <Icon name="chat" size={20} className="text-zinc-500 dark:text-zinc-400" /> Stuck? Ask the AI tutor
            </h2>
            <p className={`mt-1 text-sm ${muted}`}>It has read this lesson and answers questions about it, with new examples.</p>
            <div className="mt-4">
              <LessonTutor enabled={aiEnabled()} lessonId={stop.id} title={stop.title} starters={stop.ask} />
            </div>
          </section>

          {interview.length > 0 && (
            <section id="interview" aria-labelledby="interview-h" className="mt-10 scroll-mt-24">
              <h2 id="interview-h" className="text-xl font-semibold">
                Interview questions on this
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {interview.map((q) => (
                  <li key={q.id} className="flex flex-wrap items-baseline gap-x-3">
                    <Link href={`/interview/${q.id}`} className={textLink}>
                      {q.question}
                    </Link>
                    <Link href={`/interview/simulator?question=${q.id}`} className="text-sm text-zinc-600 underline underline-offset-2 dark:text-zinc-400">
                      Answer it out loud
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          </ContentGate>

          <div className="xl:hidden">
            <RoadmapLessons />
          </div>

          <RoadmapPrevNext />

          {/* RM-10: where this lesson sits, and tags that open the Library filtered the same way. */}
          <section aria-labelledby="related-h" className="mt-10 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <h2 id="related-h" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Related
            </h2>
            {paths.length > 0 && (
              <p className={`mt-2 text-sm ${muted}`}>
                On {paths.length === 1 ? "the roadmap" : "these roadmaps"}:{" "}
                {paths.map((p, i) => (
                  <span key={p.id}>
                    {i > 0 && ", "}
                    <Link href={roadmapHref(p.id)} className={textLink}>
                      {p.name}
                    </Link>
                  </span>
                ))}
              </p>
            )}
            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm" aria-label="Tags">
              <Link href={`/library?topic=${stop.theme}`} className="inline-flex min-h-11 items-center rounded-full bg-brand-50 px-3 font-medium text-brand-900 ring-1 ring-brand-200 hover:bg-brand-100 dark:hover:bg-brand-900 dark:bg-brand-950 dark:text-brand-200 dark:ring-brand-900">
                {theme.label}
              </Link>
              <Link href={`/library?level=${stop.level}`} className="inline-flex min-h-11 items-center rounded-full bg-brand-50 px-3 font-medium text-brand-900 ring-1 ring-brand-200 hover:bg-brand-100 dark:hover:bg-brand-900 dark:bg-brand-950 dark:text-brand-200 dark:ring-brand-900">
                {levelWords(stop.level)}: {level?.name}
              </Link>
              {stop.videos.length > 0 && (
                <Link href={`/library?kind=video&topic=${stop.theme}`} className="inline-flex min-h-11 items-center rounded-full bg-brand-50 px-3 font-medium text-brand-900 ring-1 ring-brand-200 hover:bg-brand-100 dark:hover:bg-brand-900 dark:bg-brand-950 dark:text-brand-200 dark:ring-brand-900">
                  Video lessons
                </Link>
              )}
              {terms.map((t) => (
                <Link key={t.id} href={`/library?q=${encodeURIComponent(t.term)}`} className="inline-flex min-h-11 items-center rounded-full bg-zinc-100 px-3 text-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {t.term}
                </Link>
              ))}
            </p>
          </section>
        </div>
        <aside className="hidden min-w-0 xl:order-3 xl:block xl:pt-10">
          <div className="sticky top-20 flex max-h-[calc(100dvh-6rem)] flex-col gap-4 overflow-y-auto pb-4">
            <ContentGate reason="lesson" title="" text="" fallback={null}>
              <LearnPanel stopId={stop.id} items={learn} headingId="learn-side" />
            </ContentGate>
            <RoadmapLessons />
          </div>
        </aside>
      </div>

      {/* RM-7: phones keep Learning / Done / Skip one tap away in a slim bar at the bottom. */}
      <div className="lx-trackbar xp-glass-strong fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-30 rounded-[1.75rem] px-4 py-2 lg:hidden print:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Track</span>
          <TopicStatus stopId={stop.id} title={stop.title} size="sm" label={`Track ${stop.title}`} />
        </div>
      </div>
    </main>
    </LessonRoadmapProvider>
  );
}
