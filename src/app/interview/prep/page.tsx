import type { Metadata } from "next";
import { ExploreTools } from "@/components/explore-tools";
import { getGlossary, getPaths, getStop } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import { PrepStudio } from "./prep-studio";

export const metadata: Metadata = {
  title: "Interview prep plan: the questions to cover each day",
  description: "Set your interview date and AI role. Get the interview questions to cover each day until then, mock interviews, a readiness score and a day-before checklist.",
  alternates: { canonical: "/interview/prep" },
};

/** PREP-1: a day-by-day question plan worked back from the learner's interview date. */
export default function InterviewPrepPage() {
  const paths = getPaths().map((p) => ({ id: p.id, name: p.name, top: p.top_interview ?? [] }));
  // PREP-5: the words a job post would use for each question: its lesson's key terms and their other spellings.
  const glossary = new Map(getGlossary().map((g) => [g.id, [g.term, ...g.also]]));
  const termsOf = (stopId: string) => (getStop(stopId)?.key_terms ?? []).flatMap((id) => glossary.get(id) ?? []);
  const questions = getInterviewViews().map((q) => ({
    id: q.id,
    question: q.question,
    short_answer: q.short_answer,
    deeper_answer: q.deeper_answer,
    level: q.level,
    topic: q.topic,
    paths: q.paths,
    often: q.often,
    terms: termsOf(q.stop.id),
  }));
  return (
    <main>
      {/* PREP-9: an app screen, so a plain title in place of the big hero. */}
      <div className="mx-auto max-w-3xl px-4 pt-8 md:px-6 md:pt-12">
        {/* The countdown below is the big line on this screen; the page's name stays small above it. */}
        <h1 className="text-sm font-medium text-brand-800 dark:text-brand-300">Your interview prep plan</h1>
      </div>
      <div className="mx-auto max-w-3xl px-4 pt-6 pb-16 md:px-6">
        <PrepStudio paths={paths} questions={questions} />
      </div>
      <ExploreTools current="/interview/prep" />
    </main>
  );
}
