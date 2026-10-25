import type { Metadata } from "next";
import Link from "next/link";
import { muted, textLink } from "@/components/ui";
import { getPaths } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import type { SimQuestion } from "@/lib/interview/analyse";
import { Simulator } from "./simulator";

export const metadata: Metadata = {
  title: "AI mock interview: answer out loud, get a report",
  description:
    "A free, timed AI interview simulator. Answer real AI interview questions out loud or by typing, within 1 to 2 minutes each, then see which key points you covered, your pace and what to fix.",
  alternates: { canonical: "/interview/simulator" },
};

/** The mock interview: the release 3 flow, browser-only and without model calls (release 1 rule). */
export default function SimulatorPage() {
  const questions: SimQuestion[] = getInterviewViews().map((q) => ({
    id: q.id,
    question: q.question,
    short_answer: q.short_answer,
    level: q.level,
    topic: q.topic,
    paths: q.paths,
    rubric: q.rubric,
    answer_seconds: q.answer_seconds,
    stop: q.stop,
  }));
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-sm print:hidden">
        <Link href="/interview" className={textLink}>
          Interview questions
        </Link>
        <span className={muted}> / Mock interview</span>
      </nav>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance">Mock interview</h1>
      <p className="mt-3 mb-6 leading-7 text-zinc-700 dark:text-zinc-300 print:hidden">
        Practise the way it happens: one question at a time, a clock running, and you answering out loud. Free, no
        sign-in.
      </p>
      <Simulator questions={questions} paths={getPaths().map((p) => ({ id: p.id, name: p.name }))} />
    </main>
  );
}
