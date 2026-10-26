import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { PageHero } from "@/components/page-hero";
import { aiEnabled } from "@/lib/ai/settings";
import type { IconName } from "@/lib/themes";

export const metadata: Metadata = {
  title: "AI tools to learn AI faster: roadmap generator, course generator, coach and tutor",
  description:
    "Free AI tools for learners: generate a personal AI roadmap, a course on any topic, get coaching, ask a tutor inside every lesson, and get AI feedback on interview answers.",
  alternates: { canonical: "/ai" },
};

const TOOLS: { href: string; title: string; text: string; icon: IconName; tone: string; tag: string }[] = [
  { href: "/ai/roadmap", title: "AI roadmap generator", text: "Your goal, level and hours in; a stage-by-stage plan linked to free lessons out. Tick topics off as you go.", icon: "map", tone: "from-violet-600 to-fuchsia-500", tag: "Most popular" },
  { href: "/ai/roadmap", title: "Change your roadmap with AI", text: "“Make it shorter”, “add interview prep”, “weekends only”. Say it in plain words and the roadmap is rewritten. Or edit it by hand.", icon: "flow", tone: "from-fuchsia-600 to-orange-500", tag: "Editor" },
  { href: "/ai/course", title: "Generate a course on anything", text: "Any topic at your level: modules, then lessons with examples, a diagram, a quiz and flashcards, written when you open them.", icon: "book", tone: "from-sky-600 to-indigo-600", tag: "New" },
  { href: "/ai/coach", title: "Personal AI coach", text: "Plans your week, keeps you going and answers career questions, knowing what you have already done.", icon: "people", tone: "from-emerald-600 to-teal-500", tag: "Coach" },
  { href: "/topics", title: "AI tutor in every lesson", text: "Stuck on a lesson? Ask the tutor at the bottom of the page. It has read the lesson and explains it another way.", icon: "chat", tone: "from-amber-500 to-rose-500", tag: "In lessons" },
  { href: "/ai/book", title: "Ask me from my book", text: "Upload your textbook or notes and get a timed MCQ test written from it. The report shows each answer on its page and what to reread.", icon: "book", tone: "from-teal-600 to-violet-600", tag: "New" },
  { href: "/interview/simulator", title: "AI interview feedback", text: "After a mock interview, get each answer graded against the key points, with a stronger version to learn from.", icon: "mic", tone: "from-rose-600 to-pink-500", tag: "Interview prep" },
];

export default function AiToolsPage() {
  const on = aiEnabled();
  return (
    <main>
      <PageHero
        theme="ai-basics"
        seed="ai-tools"
        icon="sparkles"
        eyebrow="AI tools"
        title="Learn faster with AI that knows our lessons"
        lead="Seven AI helpers built on Claude, an AI model from Anthropic. Free for signed-in learners aged 18 or over, with a fair daily allowance."
      />
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        {!on && (
          <p className="mb-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            AI tools are switched off right now. Roadmaps, lessons, the course directory and interview practice all work without them.
          </p>
        )}
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <li key={t.title}>
              <Link href={t.href} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white transition hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                <span className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${t.tone} text-white`}>
                  <Icon name={t.icon} size={48} strokeWidth={1.5} />
                  <span className="absolute top-3 left-3 rounded-full bg-black/30 px-2.5 py-0.5 text-xs font-medium backdrop-blur">{t.tag}</span>
                </span>
                <span className="flex flex-1 flex-col p-5">
                  <span className="text-lg font-semibold group-hover:underline">{t.title}</span>
                  <span className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">{t.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <section aria-labelledby="fair-use" className="mt-12 grid gap-6 md:grid-cols-3">
          <h2 id="fair-use" className="sr-only">
            How the AI tools work
          </h2>
          {[
            ["Free, with a daily allowance", "Each learner gets a few roadmaps, courses and grades a day, and more tutor and coach messages. It resets at midnight India time."],
            ["Your words are data, not commands", "What you type is sent to Anthropic only to write your answer. It is never used to rank courses, and we never sell it."],
            ["AI can be wrong", "Generated roadmaps, courses and answers are a starting point, not the last word. Check anything important against a trusted source."],
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
