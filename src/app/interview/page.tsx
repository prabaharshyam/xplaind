import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { Icon } from "@/components/art/icons";
import { textLink } from "@/components/ui";
import type { IconName } from "@/lib/themes";
import { getPaths } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import { InterviewList } from "./interview-list";

export const metadata: Metadata = pageMeta({
  // SE-8: search-led title and description.
  title: ["AI Interview Questions and Answers (Freshers & Experienced)", "AI Interview Questions and Answers"],
  description:
    "AI interview questions and answers for freshers and experienced, for every AI role: a short answer to say out loud, a deeper answer and common mistakes.",
  path: "/interview",
});

// IP-4 (owner request, 2026-11-16): interview patterns and system design answers come last, and the
// practice cards live under the Practice menu only, so each thing has one home.
const HUB: { href: string; title: string; text: string; icon: IconName }[] = [
  { href: "/interview/simulator", title: "Mock interview", text: "Answer out loud and get a report on the key points you covered.", icon: "mic" },
  { href: "/interview/answers", title: "Q&A by role", text: "Every question for your role with a short and a deeper answer.", icon: "chat" },
  { href: "/interview/patterns", title: "Interview patterns", text: "RAG, agents, evals, serving and safety: the ideas every AI round reuses, and how to say them.", icon: "flow" },
  { href: "/interview/design", title: "System design answers", text: "Worked LLM designs in the 35-minute shape interviewers expect.", icon: "target" },
];

export default function InterviewPage() {
  const questions = getInterviewViews();
  const paths = getPaths();
  return (
    <main>
      <PageHero
        size="full" shape="speech"
        theme="career"
        seed="interview"
        icon="mic"
        eyebrow="Interview prep"
        title="AI interview questions"
        lead={`${questions.length} questions AI interviews ask, each with a short answer you can say out loud, a deeper answer, the follow-ups to expect and the mistakes to avoid.`}
      />
      {/* IP-5 (owner request, 2026-11-16): the Question bank is what a visitor came for, so it comes first.
          The ways to prepare sit in a side panel on wide screens and in a compact row above the list on phones. */}
      <div className="mx-auto grid max-w-6xl gap-x-12 gap-y-6 px-4 py-8 md:px-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <aside aria-labelledby="prep-heading" className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-24 lg:self-start">
          <h2 id="prep-heading" className="text-lg font-semibold tracking-tight">
            Prepare for your AI interview
          </h2>
          {/* One row you can swipe on a phone, so the question bank stays near the top; a column on wide screens. */}
          <ul className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6 lg:mx-0 lg:flex-col lg:gap-3 lg:overflow-visible lg:px-0 lg:pb-0">
            {HUB.map((h) => (
              <li key={h.href} className="shrink-0 lg:shrink">
                <Link
                  href={h.href}
                  className="flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full lg:whitespace-normal border border-zinc-200 bg-white px-4 text-sm font-medium transition-colors hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 lg:items-start lg:gap-4 lg:rounded-2xl lg:p-4 lg:text-base dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
                >
                  <span className="grid size-6 shrink-0 place-items-center text-zinc-700 lg:size-11 lg:rounded-2xl lg:bg-zinc-100 dark:text-zinc-300 lg:dark:bg-zinc-800">
                    <Icon name={h.icon} size={18} />
                  </span>
                  <span>
                    <span className="block font-semibold">{h.title}</span>
                    <span className="mt-1 hidden text-sm leading-6 font-normal text-zinc-700 lg:block dark:text-zinc-300">{h.text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <h2 className="text-2xl font-semibold tracking-tight">Question bank</h2>
          <nav aria-labelledby="by-role" className="mt-6">
            <h2 id="by-role" className="text-lg font-semibold">
              Questions by role
            </h2>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {paths.map((p) => (
                <li key={p.id}>
                  <Link href={`/interview/for/${p.id}`} className={textLink}>
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-8">
            <InterviewList questions={questions} paths={paths.map((p) => ({ id: p.id, name: p.name }))} />
          </div>
        </div>
      </div>
    </main>
  );
}
