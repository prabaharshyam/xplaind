import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { getPaths } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import type { SimQuestion } from "@/lib/interview/analyse";
import { aiEnabled } from "@/lib/ai/settings";
import { Simulator } from "./simulator";

export const metadata: Metadata = {
  title: "AI mock interview: answer out loud, get a report",
  description:
    "A free, timed AI interview simulator. Answer real AI interview questions out loud or by typing, within 1 to 2 minutes each, then see which key points you covered, your pace and what to fix.",
  alternates: { canonical: "/interview/simulator" },
};

/** The mock interview: answers are analysed in the browser; signed-in learners can add an AI review (IQ-7). */
export default function SimulatorPage() {
  const questions: SimQuestion[] = getInterviewViews().map((q) => ({
    id: q.id,
    question: q.question,
    short_answer: q.short_answer,
    deeper_answer: q.deeper_answer,
    level: q.level,
    topic: q.topic,
    paths: q.paths,
    rubric: q.rubric,
    answer_seconds: q.answer_seconds,
    stop: q.stop,
  }));
  return (
    <main>
      <div className="print:hidden">
        <PageHero
          theme="client"
          seed="simulator"
          icon="mic"
          eyebrow="Interview prep"
          title="Mock interview"
          lead="Practise the way it happens: one question at a time, a clock running, and you answering out loud. Then see what you covered and missed. Free, no sign-in."
          crumbs={[{ href: "/interview", label: "Interview questions" }]}
        />
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Simulator questions={questions} paths={getPaths().map((p) => ({ id: p.id, name: p.name }))} aiOn={aiEnabled()} />
      </div>
    </main>
  );
}
