import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
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
      <PageHero
        size="full"
        shape="calendar"
        theme="career"
        seed="prep"
        icon="mic"
        eyebrow="Interview prep"
        title="Your interview prep plan"
        lead="Tell us the date and the role. You get the questions to cover each day until then, mock interviews, a readiness score and a checklist for the day before."
      />
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
        <PrepStudio paths={paths} questions={questions} />
      </div>
    </main>
  );
}
