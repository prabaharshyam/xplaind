import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import { getPaths } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import type { Pickable } from "@/lib/interview/setup";
import { aiEnabled } from "@/lib/ai/settings";
import { Simulator } from "./simulator";

export const metadata: Metadata = pageMeta({
  // SE-8: search-led title and description.
  title: ["AI Mock Interview: Practise Out Loud, Get a Report", "AI Mock Interview Simulator"],
  description:
    "Practise with Zarina, an AI interviewer that asks AI interview questions out loud, follows up on what you actually say and scores you like a hiring panel. Set it up for your role or a job post. Your first interview is free.",
  path: "/interview/simulator",
  ownImage: true,
});

/** The mock interview: answers are analysed in the browser; signed-in learners can add an AI review (IQ-7). */
export default function SimulatorPage() {
  const questions: Pickable[] = getInterviewViews().map((q) => ({
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
    kind: q.kind,
  }));
  return (
    <main>
      {/* VI-12: the page is the interview room; the setup carries its own first screen and title. */}
      <Simulator questions={questions} paths={getPaths().map((p) => ({ id: p.id, name: p.name }))} aiOn={aiEnabled()} />
    </main>
  );
}
