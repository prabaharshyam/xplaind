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

const HUB: { href: string; title: string; text: string; icon: IconName }[] = [
  { href: "/interview/patterns", title: "Interview patterns", text: "RAG, agents, evals, serving and safety: the ideas every AI round reuses, and how to say them.", icon: "flow" },
  { href: "/interview/design", title: "System design answers", text: "Worked LLM designs in the 35-minute shape interviewers expect.", icon: "target" },
  { href: "/interview/simulator", title: "Mock interview", text: "Answer out loud and get a report on the key points you covered.", icon: "mic" },
  { href: "/interview/answers", title: "Q&A by role", text: "Every question for your role with a short and a deeper answer.", icon: "chat" },
  { href: "/practice", title: "Practice cards", text: "Flashcards that bring back the questions you missed.", icon: "check" },
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
      {/* IP-3: the interview hub: the ways to prepare, before the question bank. */}
      <div className="mx-auto max-w-6xl px-4 pt-10 md:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">Prepare for your AI interview</h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HUB.map((h) => (
            <li key={h.href}>
              <Link
                href={h.href}
                className="flex h-full items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition-colors dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <Icon name={h.icon} size={20} />
                </span>
                <span>
                  <span className="block font-semibold">{h.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-zinc-700 dark:text-zinc-300">{h.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8">
      <h2 className="text-2xl font-semibold tracking-tight">Question bank</h2>
      <nav aria-labelledby="by-role" className="mt-8">
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
    </main>
  );
}
