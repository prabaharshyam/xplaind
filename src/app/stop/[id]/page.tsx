import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { muted, textLink } from "@/components/ui";
import { GENAI_PATH_ID, getContent, getGlossary, getLevel, getStop, getStops, pathLessons, pathsWithLesson } from "@/lib/content";
import { Cover } from "@/components/art/cover";
import { Icon } from "@/components/art/icons";
import { XP } from "@/lib/game/xp";
import { type IconName, themeOf } from "@/lib/themes";
import { LessonNav, type SectionLink } from "./lesson-nav";
import { roadmapHref } from "@/lib/paths";
import { resourceCard } from "@/lib/content/cards";
import { getInterviewViews } from "@/lib/content/interview";
import type { CheckQuestionView } from "./stop-progress";
import { StopProgressPanel } from "./stop-progress";
import { StopResources } from "./stop-resources";
import { LessonTutor } from "./lesson-tutor";
import { LessonExercise } from "./lesson-exercise";
import { PathLessons } from "./path-lessons";
import { Flashcards } from "@/components/flashcards";
import { aiEnabled } from "@/lib/ai/settings";

/** Lesson text: headings, lists, code and tables styled without a typography plugin. Code scrolls inside its box at 360px. */
const PROSE =
  "mt-2 leading-7 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:font-semibold [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_strong]:font-semibold [&_blockquote]:mt-3 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-700 dark:[&_blockquote]:border-zinc-700 dark:[&_blockquote]:text-zinc-300 [&_pre]:mt-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-100 [&_pre]:p-3 [&_pre]:text-sm dark:[&_pre]:bg-zinc-900 [&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-zinc-100 [&_:not(pre)>code]:px-1 dark:[&_:not(pre)>code]:bg-zinc-900 [&_table]:mt-3 [&_table]:block [&_table]:overflow-x-auto [&_td]:border [&_td]:border-zinc-300 [&_td]:p-2 [&_th]:border [&_th]:border-zinc-300 [&_th]:p-2 [&_th]:text-left dark:[&_td]:border-zinc-700 dark:[&_th]:border-zinc-700 [&_table]:w-full [&_table]:border-collapse [&_th]:bg-zinc-100 dark:[&_th]:bg-zinc-900 [&_pre:has(>code.language-text)]:bg-zinc-950 [&_pre:has(>code.language-text)]:p-4 [&_pre:has(>code.language-text)]:leading-6 [&_pre:has(>code.language-text)]:text-emerald-100 dark:[&_pre:has(>code.language-text)]:bg-black";

/** Code blocks scroll sideways on phones, so keyboard users must be able to focus them (WCAG 2.1.1). */
const MDX_COMPONENTS = {
  pre: (props: React.ComponentProps<"pre">) => <pre tabIndex={0} {...props} />,
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

/** Free courses from other providers on the same topic: a short list, after the main picks. */
function MoreCourses({ stopId, courses }: { stopId: string; courses: ReturnType<typeof resourceCard>[] }) {
  if (courses.length === 0) return null;
  return (
    <section aria-labelledby="more-courses" className="mt-6">
      <h3 id="more-courses" className="font-semibold">
        More free courses on this topic
      </h3>
      <ul className="mt-2 flex flex-col gap-2">
        {courses.map((c) => (
          <li key={c.id} className="leading-7">
            <a href={`/go/${c.id}?stop=${encodeURIComponent(stopId)}`} target="_blank" rel="noopener" className={textLink}>
              {c.title}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>{" "}
            <span className={`text-sm ${muted}`}>
              {c.provider} · {c.hours} h{c.certificate ? " · certificate or badge" : ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function generateStaticParams() {
  return getStops().map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/stop/[id]">): Promise<Metadata> {
  const stop = getStop((await params).id);
  return stop ? { title: stop.title, description: stop.outcome } : {};
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
    { id: "courses", title: "Best free course", icon: "book" },
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
      <header className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}>
        <Cover theme={stop.theme} seed={stop.id} className="absolute inset-0 opacity-60 [&>div:last-child]:hidden" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:items-end md:justify-between md:px-6 md:py-12">
          <div className="max-w-3xl">
            <nav aria-label="Breadcrumb" className="text-sm text-white/90">
              {onGenai ? (
                <>
                  <Link href={roadmapHref(GENAI_PATH_ID)} className="underline underline-offset-2">
                    Roadmap
                  </Link>
                  <span> / </span>
                  <Link href={`/roadmap/genai-engineer/${stop.level.toLowerCase()}`} className="underline underline-offset-2">
                    {stop.level} {level?.name}
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
            <p className="mt-3 text-lg leading-8 text-white/95">{stop.outcome}</p>
            <p className="mt-4 flex flex-wrap gap-2 text-sm">
              {[`${stop.level} · ${level?.name ?? ""}`, `about ${stop.hours} ${stop.hours === 1 ? "hour" : "hours"}`, `${sections.length || 1} sections`].map((c) => (
                <span key={c} className="rounded-full bg-black/25 px-3 py-1 backdrop-blur">
                  {c}
                </span>
              ))}
              <span className="rounded-full bg-amber-300 px-3 py-1 font-semibold text-amber-950">+{xpToEarn} XP</span>
            </p>
          </div>
          <span className="hidden size-24 shrink-0 place-items-center rounded-3xl bg-white/20 ring-1 ring-white/40 backdrop-blur md:grid">
            <Icon name={theme.icon} size={52} strokeWidth={1.5} />
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 md:px-6 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0 lg:order-2">
          <LessonNav sections={navSections}>
            {home && <PathLessons pathName={home.name} lessons={order.map((l) => ({ id: l.id, title: l.title }))} current={stop.id} />}
          </LessonNav>
        </div>
        <div className="min-w-0 pt-6 lg:order-1 lg:pt-10">
          {paths.length > 0 && (
            <p className={`text-sm ${muted}`}>
              On {paths.length === 1 ? "the path" : "these paths"}:{" "}
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

          <section id="why" aria-labelledby="why-h" className="mt-6 scroll-mt-24 rounded-2xl border-l-4 border-amber-400 bg-amber-50 p-5 dark:bg-amber-950/40">
            <h2 id="why-h" className="flex items-center gap-2 text-lg font-semibold">
              <Icon name="star" size={20} className="text-amber-600" /> Why it matters
            </h2>
            <p className="mt-2 leading-7">{stop.why_it_matters}</p>
          </section>

          {explainer ? (
            sections.map((sec, i) => (
              <section
                key={sec.title}
                id={slug(sec.title)}
                aria-labelledby={`${slug(sec.title)}-h`}
                className={`mt-6 scroll-mt-24 rounded-2xl border p-5 md:p-6 ${SECTION_TONE[sec.title] ?? "border-zinc-200 dark:border-zinc-800"}`}
              >
                <h2 id={`${slug(sec.title)}-h`} className="flex items-center gap-3 text-xl font-semibold">
                  <span className="grid size-9 place-items-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}>
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
            ))
          ) : (
            <section className="mt-6">
              <h2 className="text-xl font-semibold">Do it</h2>
              <div className={PROSE}>
                <MDXRemote source={stop.body} components={MDX_COMPONENTS} options={MDX_OPTIONS} />
              </div>
            </section>
          )}

          {stop.exercise && (
            <section id="try-it" aria-labelledby="try-it-h" className="mt-6 scroll-mt-24 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50/60 p-5 md:p-6 dark:border-amber-700 dark:bg-amber-950/20">
              <h2 id="try-it-h" className="flex items-center gap-3 text-xl font-semibold">
                <span className="grid size-9 place-items-center rounded-xl bg-amber-400 text-amber-950">
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
                  <details key={t.id} className="group rounded-xl bg-white px-4 py-3 dark:bg-zinc-950">
                    <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-3 font-medium [&::-webkit-details-marker]:hidden">
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

          <section id="courses" aria-labelledby="courses-h" className="mt-8 scroll-mt-24">
            <h2 id="courses-h" className="text-xl font-semibold">
              {explainer ? "Go deeper: the best free course" : "Learn it"}
            </h2>
            <StopResources stopId={stop.id} cards={cards} />
            <MoreCourses stopId={stop.id} courses={more} />
          </section>

          <section id="check" aria-labelledby="check-h" className="mt-8 scroll-mt-24 rounded-2xl border-2 border-emerald-600 p-5 md:p-6">
            <h2 id="check-h" className="flex flex-wrap items-center gap-3 text-xl font-semibold">
              <Icon name="check" size={22} className="text-emerald-700 dark:text-emerald-400" /> Check
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                +{xpToEarn} XP
              </span>
            </h2>
            <StopProgressPanel stopId={stop.id} check={check} />
          </section>

          <section id="tutor" aria-labelledby="tutor-h" className="mt-8 scroll-mt-24 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5 md:p-6 dark:border-violet-900 dark:from-violet-950/30 dark:to-fuchsia-950/20">
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
        </div>
      </div>
    </main>
  );
}
