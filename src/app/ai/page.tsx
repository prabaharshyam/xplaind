import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { LessonCard } from "@/components/lesson-card";
import { PageHero } from "@/components/page-hero";
import { getStops } from "@/lib/content";
import { aiEnabled } from "@/lib/ai/settings";
import type { IconName } from "@/lib/themes";

export const metadata: Metadata = {
  title: "AI tools to learn AI faster",
  description:
    "AI tools for learners: a personal AI roadmap, an AI tutor in every lesson, a resume review, a Python code playground and AI feedback on interview answers.",
  alternates: { canonical: "/ai" },
};

type Tool = { href: string; title: string; text: string; icon: IconName; tone: string; ai: boolean; give: string; get: string };

/**
 * AI-1: the tools, shown like apps in a product launcher: an app icon, what it does in one line, what
 * you give it and what you get back, and an Open button. Grouped by the job the learner is doing.
 */
const GROUPS: { id: string; title: string; lead: string; tools: Tool[] }[] = [
  {
    id: "study",
    title: "Study",
    lead: "Understand topics faster and know what to learn next.",
    tools: [
      { href: "/ai/book", title: "Ask me from my book", text: "Turns your textbook or notes into a timed multiple-choice test, and shows what to reread.", icon: "book", tone: "from-teal-500 to-teal-700", ai: true, give: "A PDF of your book or notes", get: "A test and a page-by-page report" },
      { href: "/ai/tutor", title: "AI tutor", text: "Explains any AI topic in plain English, with examples, and knows which lessons you have done.", icon: "chat", tone: "from-violet-500 to-violet-700", ai: true, give: "Your question", get: "A clear answer and lessons to read" },
      { href: "/ai/roadmap", title: "AI roadmap generator", text: "Builds a stage-by-stage plan for your goal, level and hours, linked to our lessons.", icon: "map", tone: "from-sky-500 to-violet-600", ai: true, give: "Your goal and weekly hours", get: "A personal roadmap to tick off" },
    ],
  },
  {
    id: "practice",
    title: "Practice",
    lead: "Write real code and answer out loud before the real thing.",
    tools: [
      { href: "/playground", title: "Code playground", text: "Write and run Python in your browser, with NumPy and pandas. If it breaks, the AI tutor explains the error.", icon: "code", tone: "from-zinc-700 to-zinc-900", ai: false, give: "Python code", get: "Output in seconds, nothing to install" },
      { href: "/interview/simulator", title: "AI interview feedback", text: "Answer interview questions out loud or by typing, then get each answer graded against the key points.", icon: "mic", tone: "from-rose-500 to-rose-700", ai: true, give: "Your spoken or typed answers", get: "A score and a stronger answer" },
    ],
  },
  {
    id: "hired",
    title: "Get hired",
    lead: "Get past the recruiter and into the interview.",
    tools: [
      { href: "/ai/resume", title: "Resume review", text: "Fixes in order of importance, rewritten lines and the keywords recruiters search for.", icon: "star", tone: "from-amber-400 to-amber-600", ai: true, give: "Your resume and target role", get: "A ranked list of fixes" },
      { href: "/interview/answers", title: "Interview Q&A by role", text: "Every interview question for your role with a short and a deeper answer, on one page.", icon: "target", tone: "from-violet-600 to-teal-600", ai: false, give: "The role you want", get: "Every question with answers" },
    ],
  },
];

/** An app icon: a rounded square in the tool's colours with a soft highlight, like a product's icon. */
function AppIcon({ icon, tone }: { icon: IconName; tone: string }) {
  return (
    <span aria-hidden="true" className={`relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-[1.1rem] bg-gradient-to-br ${tone} text-white shadow-md ring-1 ring-black/5`}>
      <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
      <Icon name={icon} size={26} strokeWidth={1.75} className="relative" />
    </span>
  );
}

export default function AiToolsPage() {
  const on = aiEnabled();
  // Complete guides to the AI tools people use at work (the "ai-tools" topic).
  const guides = getStops()
    .filter((s) => s.theme === "ai-tools")
    .map((s) => ({ id: s.id, title: s.title, outcome: s.outcome, hours: s.hours, level: s.level, theme: s.theme }));
  return (
    <main>
      <PageHero
        shape="brain"
        theme="ai-basics"
        seed="ai-tools"
        icon="sparkles"
        eyebrow="AI tools"
        title="Learn faster with AI that knows our lessons"
        lead="AI helpers built on Claude, an AI model from Anthropic, plus study tools for interviews and research papers. Free, and no account needed."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        {!on && (
          <p className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            The AI-powered tools are paused right now. The tools marked &ldquo;No AI needed&rdquo;, and all roadmaps and lessons, work as usual.
          </p>
        )}
        <div className="flex flex-col gap-12">
          {GROUPS.map((g) => (
            <section key={g.id} aria-labelledby={`tools-${g.id}`}>
              <h2 id={`tools-${g.id}`} className="text-2xl font-semibold tracking-tight">
                {g.title}
              </h2>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">{g.lead}</p>
              <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {g.tools.map((t) => {
                  const paused = t.ai && !on;
                  return (
                    <li key={t.href}>
                      <Link
                        href={t.href}
                        data-tilt="3"
                        className="group relative flex h-full flex-col rounded-3xl border border-zinc-200 bg-white p-5 transition hover:border-violet-300 hover:shadow-lg hover:shadow-violet-950/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-800"
                      >
                        <span className="flex items-start gap-4">
                          <AppIcon icon={t.icon} tone={t.tone} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-lg leading-6 font-semibold">{t.title}</span>
                            <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-medium">
                              {t.ai ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-violet-800 dark:bg-violet-950 dark:text-violet-200">
                                  <Icon name="sparkles" size={12} /> Uses AI
                                </span>
                              ) : (
                                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">No AI needed</span>
                              )}
                              {paused && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900 dark:bg-amber-950 dark:text-amber-200">Paused</span>}
                            </span>
                          </span>
                        </span>
                        <span className="text-card mt-4 text-zinc-700 dark:text-zinc-300">{t.text}</span>
                        <span className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-2xl bg-zinc-50 px-3 py-2.5 text-sm dark:bg-zinc-950">
                          <span className="text-zinc-600 dark:text-zinc-400">You give</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{t.give}</span>
                          <span className="text-zinc-600 dark:text-zinc-400">You get</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{t.get}</span>
                        </span>
                        <span className="mt-auto flex items-center justify-end pt-4">
                          <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-violet-700 px-4 text-sm font-semibold text-white transition group-hover:bg-violet-800">
                            Open<span className="sr-only"> {t.title}</span>
                            <span aria-hidden="true" className="transition group-hover:translate-x-0.5">
                              →
                            </span>
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
        {guides.length > 0 && (
          <section aria-labelledby="guides-h" className="mt-14">
            <h2 id="guides-h" className="text-2xl font-semibold tracking-tight">
              Complete guides to the AI tools people use at work
            </h2>
            <p className="mt-2 max-w-3xl leading-7 text-zinc-700 dark:text-zinc-300">
              Step-by-step lessons with the most watched video tutorials and a real project: vibe coding with Claude Code, automation with
              n8n, voice agents with Vapi, animated and cinematic AI video, and AI images.
            </p>
            <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((g) => (
                <li key={g.id}>
                  <LessonCard l={g} />
                </li>
              ))}
            </ul>
          </section>
        )}
        <section aria-labelledby="fair-use" className="mt-12 grid gap-6 md:grid-cols-3">
          <h2 id="fair-use" className="sr-only">
            How the AI tools work
          </h2>
          {[
            ["A daily allowance", "Everyone gets a few roadmaps, reviews and grades a day, and more tutor messages. It resets at midnight India time."],
            ["Your words are data, not commands", "What you type is sent to Anthropic only to write your answer. It is never used to rank courses, and we never sell it."],
            ["AI can be wrong", "Generated roadmaps, reviews and answers are a starting point, not the last word. Check anything important against a trusted source."],
          ].map(([h, p]) => (
            <div key={h} className="rounded-2xl bg-zinc-100 p-5 dark:bg-zinc-900">
              <h3 className="font-semibold">{h}</h3>
              <p className="mt-1 leading-7 text-zinc-700 dark:text-zinc-300">{p}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
