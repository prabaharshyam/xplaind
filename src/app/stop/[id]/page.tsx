import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { RunnableCode } from "@/components/playground/runnable-code";
import remarkGfm from "remark-gfm";
import { muted, textLink } from "@/components/ui";
import { GENAI_PATH_ID, getContent, getGlossary, getLevel, getStop, getStops, pathLessons, pathsWithLesson } from "@/lib/content";
import { Cover } from "@/components/art/cover";
import { Icon } from "@/components/art/icons";
import { XP } from "@/lib/game/xp";
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
import { PathLessons } from "./path-lessons";
import { Flashcards } from "@/components/flashcards";
import { TopicStatus } from "@/components/roadmap/topic-status";
import { aiEnabled } from "@/lib/ai/settings";
import { levelWords } from "@/lib/levels";

/** Lesson text: headings, lists, code and tables styled without a typography plugin. Code scrolls inside its box at 360px. */
const PROSE =
  "mt-2 leading-7 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:font-semibold [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_strong]:font-semibold [&_blockquote]:mt-3 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-700 dark:[&_blockquote]:border-zinc-700 dark:[&_blockquote]:text-zinc-300 [&_pre]:mt-3 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-zinc-100 [&_pre]:p-3 [&_pre]:text-sm dark:[&_pre]:bg-zinc-900 [&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-zinc-100 [&_:not(pre)>code]:px-1 dark:[&_:not(pre)>code]:bg-zinc-900 [&_table]:mt-3 [&_table]:block [&_table]:overflow-x-auto [&_td]:border [&_td]:border-zinc-300 [&_td]:p-2 [&_th]:border [&_th]:border-zinc-300 [&_th]:p-2 [&_th]:text-left dark:[&_td]:border-zinc-700 dark:[&_th]:border-zinc-700 [&_table]:w-full [&_table]:border-collapse [&_th]:bg-zinc-100 dark:[&_th]:bg-zinc-900 [&_pre:has(>code.language-text)]:bg-zinc-950 [&_pre:has(>code.language-text)]:p-4 [&_pre:has(>code.language-text)]:leading-6 [&_pre:has(>code.language-text)]:text-emerald-100 dark:[&_pre:has(>code.language-text)]:bg-black";

/** Code blocks and tables scroll sideways on phones, so keyboard users must be able to focus them (WCAG 2.1.1). */
/** PG-4: Python examples in lessons get a "Run this code" button; other code stays as it is. */
function LessonPre(props: React.ComponentProps<"pre">) {
  const child = props.children as React.ReactElement<{ className?: string; children?: unknown }> | undefined;
  const lang = child?.props?.className ?? "";
  const text = typeof child?.props?.children === "string" ? child.props.children : null;
  const pre = <pre tabIndex={0} {...props} />;
  if (!text || !/\blanguage-(python|py)\b/.test(lang)) return pre;
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
  Practise: "target",
};
const SECTION_TONE: Record<string, string> = {
  "A worked example": "border-sky-200 bg-sky-50/50 dark:border-sky-900 dark:bg-sky-950/30",
  "Common mistakes": "border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/30",
  Practise: "border-violet-200 bg-violet-50/50 dark:border-violet-900 dark:bg-violet-950/30",
};

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

export function generateStaticParams() {
  return getStops().map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/stop/[id]">): Promise<Metadata> {
  const stop = getStop((await params).id);
  if (!stop) return {};
  // SE-3: answer-first: the plain answer is what search and AI results quote.
  return pageMeta({
    // Add the search phrase only while the whole title still fits in a result.
    title: stop.title.length <= 32 ? `${stop.title}: explained simply` : stop.title,
    description: stop.answer,
    path: `/stop/${stop.id}`,
    type: "article",
    modifiedTime: stop.reviewed_on,
  });
}

export default async function StopPage({ params }: PageProps<"/stop/[id]">) {
  const stop = getStop((await params).id);
  if (!stop) notFound();

  const level = getLevel(stop.level);
  const paths = pathsWithLesson(stop.id);
  const onGenai = paths.some((p) => p.id === GENAI_PATH_ID);
  const terms = stop.key_terms.map((id) => getGlossary().find((g) => g.id === id)!);
  const explainer = stop.format !== "brief";
  const interview = getInterviewViews().filter((q) => q.stop.id === stop.id);
  const cards = [stop.primary_resource, ...stop.alternates].map(resourceCard);
  const more = stop.more.map(resourceCard);
  // RM-4: the Watch & learn panel holds only videos; courses and articles get full cards after the text.
  const isVideo = (c: (typeof cards)[number]) => Boolean(c.embed) || /video/i.test(c.kindLabel);
  const learn = [...stop.videos.map(resourceCard), ...cards, ...more].filter(isVideo);
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
    { id: "why", title: "Why it matters", icon: "star" },
    ...sections.map((sec) => ({ id: slug(sec.title), title: sec.title, icon: SECTION_ICON[sec.title] ?? ("book" as const) })),
    ...(stop.exercise ? [{ id: "try-it", title: stop.exercise.title, icon: "bolt" as const }] : []),
    ...(stop.flashcards.length ? [{ id: "flashcards", title: "Test your understanding", icon: "check" as const }] : []),
    ...(courses.length ? [{ id: "courses", title: "Best course", icon: "book" as const }] : []),
    ...(books.length ? [{ id: "books", title: "Books", icon: "book" as const }] : []),
    { id: "check", title: "Quick check", icon: "check" },
    { id: "tutor", title: "Ask the AI tutor", icon: "sparkles" },
  ];
  const home = paths[0];
  const order = home ? pathLessons(home.id) : [];
  const at = order.findIndex((l) => l.id === stop.id);
  const prev = at > 0 ? order[at - 1] : null;
  const next = at >= 0 && at < order.length - 1 ? order[at + 1] : null;
  const xpToEarn = stop.check.type === "project" ? XP.lessonProject : XP.lessonCheck;

  return (
    <main>
      {/* MO-2: a reading-progress bar under the top bar. */}
      <div aria-hidden="true" className="lx-progress" />
      <LessonVisit stopId={stop.id} />
      <JsonLd data={lessonGraph(stop, paths)} />
      {/* A11Y-1: the light end of a topic's colours is blended in only a third of the way, and a dark layer sits
          over the art, so white text keeps at least 4.5:1 contrast on every topic. */}
      <header className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, ${theme.from}, color-mix(in srgb, ${theme.to} 35%, ${theme.from}))` }}>
        <Cover theme={stop.theme} seed={stop.id} className="absolute inset-0 opacity-60 [&>div:last-child]:hidden" />
        <div aria-hidden="true" className="absolute inset-0 bg-black/[0.22]" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-end md:justify-between md:px-6 md:py-12">
          <div className="max-w-3xl">
            <nav aria-label="Breadcrumb" className="text-sm text-white/90">
              {onGenai ? (
                <>
                  <Link href={roadmapHref(GENAI_PATH_ID)} className="underline underline-offset-2">
                    Roadmap
                  </Link>
                  <span> / </span>
                  <Link href={`/roadmap/genai-engineer/${stop.level.toLowerCase()}`} className="underline underline-offset-2">
                    {levelWords(stop.level)}: {level?.name}
                  </Link>
                </>
              ) : (
                <Link href={home ? roadmapHref(home.id) : "/paths"} className="underline underline-offset-2">
                  {home ? `${home.name} roadmap` : "Paths"}
                </Link>
              )}
              <span> / </span>
              <Link href={`/topics/${theme.id}`} className="underline underline-offset-2">
                {theme.label}
              </Link>
            </nav>
            <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-balance drop-shadow-sm md:text-5xl">{stop.title}</h1>
            <p className="mt-3 text-base leading-7 text-white md:text-lg md:leading-8">{stop.outcome}</p>
            <p className="mt-4 flex flex-wrap gap-2 text-sm">
              {[`${levelWords(stop.level)} · ${level?.name ?? ""}`, `about ${stop.hours} ${stop.hours === 1 ? "hour" : "hours"}`, `${sections.length || 1} sections`].map((c) => (
                <span key={c} className="rounded-full bg-black/35 px-3 py-1">
                  {c}
                </span>
              ))}
              <span className="rounded-full bg-amber-300 px-3 py-1 font-semibold text-amber-950">+{xpToEarn} XP</span>
            </p>
          </div>
          {/* MO-8: the lesson's topic as a particle sculpture. */}
          {/* White particles: the lesson header is already in the topic's colours. */}
          <ParticleScene shape={THEME_SHAPE[stop.theme]} colors={["#ffffff", "#fdf2f8", "#fef9c3"]} icon={theme.icon} className="hidden h-64 w-96 shrink-0 md:block" />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 md:px-6 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0 lg:order-2">
          <LessonNav sections={navSections} top={<LearnPanel stopId={stop.id} items={learn} headingId="learn-side" />}>
            {home && <PathLessons pathName={home.name} lessons={order.map((l) => ({ id: l.id, title: l.title }))} current={stop.id} />}
          </LessonNav>
        </div>
        <div className="min-w-0 pt-6 lg:order-1 lg:pt-10">
          {/* RM-7: on a big screen the Learning / Done / Skip buttons sit at the top; phones get the bar at the bottom. */}
          <div className="mb-6 hidden flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 lg:flex dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-sm font-medium">Track this topic</span>
            <TopicStatus stopId={stop.id} title={stop.title} label={`Track ${stop.title}`} />
          </div>

          {/* SE-4: the answer first, in plain words, for readers in a hurry and for search and AI results. */}
          <section aria-labelledby="answer-h" className="rounded-2xl bg-violet-50 p-5 ring-1 ring-violet-200 dark:bg-violet-950/40 dark:ring-violet-900">
            <h2 id="answer-h" className="text-sm font-semibold text-violet-800 dark:text-violet-300">
              Quick answer
            </h2>
            <p className="mt-1 text-lg leading-8 text-zinc-900 dark:text-zinc-100">{stop.answer}</p>
          </section>

          <section id="why" aria-labelledby="why-h" className="mt-6 scroll-mt-24 rounded-2xl border-l-4 border-amber-400 bg-amber-50 p-5 dark:bg-amber-950/40">
            <h2 id="why-h" className="flex items-center gap-2 text-lg font-semibold">
              <Icon name="star" size={20} className="text-amber-600" /> Why it matters
            </h2>
            <p className="mt-2 leading-7">{stop.why_it_matters}</p>
          </section>

          {explainer ? (
            sections.map((sec, i) => (
              <Fragment key={sec.title}>
              <section
                id={slug(sec.title)}
                aria-labelledby={`${slug(sec.title)}-h`}
                className={`mt-6 scroll-mt-24 rounded-2xl border p-5 md:p-6 ${SECTION_TONE[sec.title] ?? "border-zinc-200 dark:border-zinc-800"}`}
              >
                <h2 id={`${slug(sec.title)}-h`} className="flex items-center gap-3 text-xl font-semibold">
                  <span className="grid size-9 place-items-center rounded-2xl text-white" style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}>
                    <Icon name={SECTION_ICON[sec.title] ?? "book"} size={18} />
                  </span>
                  <span>
                    <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Part {i + 1} of {sections.length}
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
                <div className="mt-6 lg:hidden">
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
            <div className="mt-6 lg:hidden">
              <LearnPanel stopId={stop.id} items={learn} headingId="learn-top" />
            </div>
          )}

          {stop.exercise && (
            <section id="try-it" aria-labelledby="try-it-h" className="mt-6 scroll-mt-24 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50/60 p-5 md:p-6 dark:border-amber-700 dark:bg-amber-950/20">
              <h2 id="try-it-h" className="flex items-center gap-3 text-xl font-semibold">
                <span className="grid size-9 place-items-center rounded-2xl bg-amber-400 text-amber-950">
                  <Icon name="bolt" size={18} />
                </span>
                {stop.exercise.title}
              </h2>
              <LessonExercise setup={stop.exercise.setup} questions={stop.exercise.questions} />
            </section>
          )}

          {stop.flashcards.length > 0 && (
            <div id="flashcards" className="mt-6 scroll-mt-24">
              <Flashcards cards={stop.flashcards} storageKey={`xplaind.cards.${stop.id}`} />
            </div>
          )}

          {terms.length > 0 && (
            <section aria-labelledby="terms-heading" className="mt-6 rounded-2xl bg-zinc-100 p-5 dark:bg-zinc-900">
              <h2 id="terms-heading" className="text-xl font-semibold">
                Key terms
              </h2>
              <p className={`mt-1 text-sm ${muted}`}>Tap a term to see what it means.</p>
              <div className="mt-3 flex flex-col gap-2">
                {terms.map((t) => (
                  <details key={t.id} className="group rounded-2xl bg-white px-4 py-3 dark:bg-zinc-950">
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

          <section id="check" aria-labelledby="check-h" className="mt-8 scroll-mt-24 rounded-2xl border-2 border-emerald-600 p-5 md:p-6">
            <h2 id="check-h" className="flex flex-wrap items-center gap-3 text-xl font-semibold">
              <Icon name="check" size={22} className="text-emerald-700 dark:text-emerald-400" /> Check
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                +{xpToEarn} XP
              </span>
            </h2>
            <StopProgressPanel stopId={stop.id} title={stop.title} check={check} />
          </section>

          <section id="tutor" aria-labelledby="tutor-h" className="mt-8 scroll-mt-24 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-teal-50 p-5 md:p-6 dark:border-violet-900 dark:from-violet-950/30 dark:to-teal-950/20">
            <h2 id="tutor-h" className="flex items-center gap-2 text-xl font-semibold">
              <Icon name="sparkles" size={22} className="text-violet-700 dark:text-violet-300" /> Stuck? Ask the AI tutor
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

          {home && (
            <div className="lg:hidden">
              <PathLessons pathName={home.name} lessons={order.map((l) => ({ id: l.id, title: l.title }))} current={stop.id} />
            </div>
          )}

          {(prev || next) && home && (
            <nav aria-label={`Lessons on the ${home.name} path`} className="mt-12 grid gap-3 sm:grid-cols-2">
              {prev ? (
                <Link href={`/stop/${prev.id}`} className="rounded-2xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                  <span className={`block text-sm ${muted}`}>← Previous</span>
                  <span className="font-medium">{prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link href={`/stop/${next.id}`} className="rounded-2xl border border-zinc-200 p-4 text-right hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                  <span className={`block text-sm ${muted}`}>Next →</span>
                  <span className="font-medium">{next.title}</span>
                </Link>
              )}
            </nav>
          )}

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
              <Link href={`/library?topic=${stop.theme}`} className="inline-flex min-h-11 items-center rounded-full bg-violet-50 px-3 font-medium text-violet-900 ring-1 ring-violet-200 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-200 dark:ring-violet-900">
                {theme.label}
              </Link>
              <Link href={`/library?level=${stop.level}`} className="inline-flex min-h-11 items-center rounded-full bg-violet-50 px-3 font-medium text-violet-900 ring-1 ring-violet-200 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-200 dark:ring-violet-900">
                {levelWords(stop.level)}: {level?.name}
              </Link>
              {stop.videos.length > 0 && (
                <Link href={`/library?kind=video&topic=${stop.theme}`} className="inline-flex min-h-11 items-center rounded-full bg-violet-50 px-3 font-medium text-violet-900 ring-1 ring-violet-200 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-200 dark:ring-violet-900">
                  Video lessons
                </Link>
              )}
              {terms.map((t) => (
                <Link key={t.id} href={`/library?q=${encodeURIComponent(t.term)}`} className="inline-flex min-h-11 items-center rounded-full bg-zinc-100 px-3 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200">
                  {t.term}
                </Link>
              ))}
            </p>
          </section>
        </div>
      </div>

      {/* RM-7: phones keep Learning / Done / Skip one tap away in a slim bar at the bottom. */}
      <div className="lx-trackbar fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden dark:border-zinc-800 dark:bg-zinc-950/95 print:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Track</span>
          <TopicStatus stopId={stop.id} title={stop.title} size="sm" label={`Track ${stop.title}`} />
        </div>
      </div>
    </main>
  );
}
