import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import { getPaths } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import { InterviewHeader } from "./interview-header";
import { QuestionsApp } from "./questions-app";

export const metadata: Metadata = pageMeta({
  // SE-8: search-led title and description.
  title: ["AI Interview Questions and Answers (Freshers & Experienced)", "AI Interview Questions and Answers"],
  description:
    "AI interview questions and answers for freshers and experienced, for every AI role: a short answer to say out loud, a deeper answer and common mistakes.",
  path: "/interview",
});

/** IP-6: the question bank and the answers by role in one app screen (it replaces IP-5's bank with a side panel). */
export default function InterviewPage() {
  const questions = getInterviewViews();
  const paths = getPaths();
  return (
    <main>
      <InterviewHeader current="questions" title="AI interview questions" lead={`${questions.length} questions AI interviews ask, each with a short answer to say out loud, a deeper answer, follow-ups and common mistakes.`} />
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-16 md:px-6">
        <QuestionsApp questions={questions} roles={paths.map((p) => ({ id: p.id, name: p.name }))} />
      </div>
    </main>
  );
}
