import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { PageHero } from "@/components/page-hero";
import { primaryButton, secondaryButton } from "@/components/ui";
import { getPaths, getStops } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "About Xplaind",
  description: "Why Xplaind exists, what it believes, and how its free AI roadmaps, lessons and course picks are made.",
  path: "/about",
});

const BELIEFS = [
  {
    icon: "map" as const,
    title: "Order beats volume",
    text: "There is no shortage of AI content. What people lack is the right next step. Every roadmap here puts topics in the order you need them, so you never wonder what to learn next.",
  },
  {
    icon: "chat" as const,
    title: "Plain English first",
    text: "Each lesson opens with a one-line answer in plain words, then builds up the idea step by step. Key terms link to a glossary that explains them simply.",
  },
  {
    icon: "scale" as const,
    title: "Picks are earned, not paid for",
    text: "No one can pay to be listed or ranked. Some book links earn a small commission; the code that orders courses and books never reads it, and a test keeps it that way.",
  },
  {
    icon: "shield" as const,
    title: "Your data stays small",
    text: "No ads and no tracking scripts. Progress stays on your device unless you choose to make an account, and you can delete an account and everything in it from Settings.",
  },
] as const;

/** TR-1: who we are and how the site is made, so a visitor can decide whether to trust it with their time. */
export default function AboutPage() {
  const roles = getPaths().length;
  const lessons = getStops().length;
  return (
    <main>
      <PageHero
        theme="ai-basics"
        shape="compass"
        icon="compass"
        eyebrow="About Xplaind"
        title="Help India learn AI faster, in the right order"
        lead="Xplaind is a free, step-by-step place to learn AI for a career: roadmaps for real roles, plain-English lessons, projects and interview practice."
      />

      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
        <section aria-labelledby="why-h">
          <h2 id="why-h" className="text-2xl font-semibold tracking-tight md:text-3xl">
            Why we built it
          </h2>
          <div className="mt-4 space-y-4 text-lg leading-8 text-zinc-800 dark:text-zinc-200">
            <p>
              Most people who try to learn AI do not quit because it is too hard. They quit because they are lost: a hundred tutorials, no
              order, and no way to tell whether they are ready for a job.
            </p>
            <p>
              Xplaind fixes the order. Pick one of {roles} AI roles and you get a roadmap from your first lesson to interview day: what to
              learn, in what order, which free course or video teaches it best, what to build, and how to explain it in an interview.
              Today that is {lessons} lessons, each written to be read in one sitting.
            </p>
          </div>
        </section>

        <section aria-labelledby="believe-h" className="mt-12">
          <h2 id="believe-h" className="text-2xl font-semibold tracking-tight md:text-3xl">
            What we believe
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {BELIEFS.map((b) => (
              <li key={b.title} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="grid size-10 place-items-center rounded-2xl bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" aria-hidden="true">
                  <Icon name={b.icon} size={20} />
                </span>
                <h3 className="mt-3 text-lg font-semibold">{b.title}</h3>
                <p className="mt-1 leading-7 text-zinc-700 dark:text-zinc-300">{b.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="how-h" className="mt-12">
          <h2 id="how-h" className="text-2xl font-semibold tracking-tight md:text-3xl">
            How the content is made
          </h2>
          <ul className="mt-4 space-y-3 text-lg leading-8 text-zinc-800 dark:text-zinc-200">
            <li>
              <strong className="font-semibold">Roadmaps</strong> cover the skills each role needs, from the basics up, and link to the skills job posts ask for.
            </li>
            <li>
              <strong className="font-semibold">Course and video picks</strong> follow published ranking rules that never look at commissions.
              Every price shows the date we checked it. <Link href="/how-we-rank" className="font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300">How we rank</Link>
            </li>
            <li>
              <strong className="font-semibold">Salaries and market numbers</strong> name their sources and the date we checked them.
            </li>
            <li>
              <strong className="font-semibold">AI helpers</strong>, such as the tutor and resume review, say when an answer comes from AI, because AI can be wrong.
            </li>
          </ul>
        </section>

        <section aria-labelledby="next-h" className="mt-14 rounded-3xl bg-violet-50 p-6 md:p-8 dark:bg-violet-950/40">
          <h2 id="next-h" className="text-2xl font-semibold tracking-tight">
            Start with one lesson
          </h2>
          <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">No sign-up needed. Pick a role and the first lesson takes about 20 minutes.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/paths" className={primaryButton}>
              Choose your AI role
            </Link>
            <Link href="/privacy" className={secondaryButton}>
              Read our privacy promise
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
