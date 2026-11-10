import type { Metadata } from "next";
import { pageMeta, titleCase } from "@/lib/seo";
import { notFound } from "next/navigation";
import { getInterviewViews, quizPoolFor } from "@/lib/content/interview";
import { INTERVIEW_TOPIC_IDS, type InterviewTopicId, interviewTopicLabel } from "@/lib/interview-topics";
import { PracticeView } from "../practice-view";

const asTopic = (v: string): InterviewTopicId | null =>
  (INTERVIEW_TOPIC_IDS as readonly string[]).includes(v) ? (v as InterviewTopicId) : null;

export function generateStaticParams() {
  return INTERVIEW_TOPIC_IDS.map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: PageProps<"/practice/[topic]">): Promise<Metadata> {
  const topic = asTopic((await params).topic);
  return topic
    ? pageMeta({
        title: [`${titleCase(interviewTopicLabel(topic))} Interview Questions: Practice Flashcards`, `${titleCase(interviewTopicLabel(topic))} Interview Questions Practice`, `${titleCase(interviewTopicLabel(topic))} Interview Practice`],
        description: `Practise ${interviewTopicLabel(topic)} interview questions with flashcards: answer out loud, check the model answer and rate yourself. Missed ones come back first.`,
        path: `/practice/${topic}`,
      })
    : {};
}

export default async function TopicPracticePage({ params }: PageProps<"/practice/[topic]">) {
  const topic = asTopic((await params).topic);
  if (!topic) notFound();
  const questions = getInterviewViews().filter((q) => q.topic === topic);
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Practice</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance">{interviewTopicLabel(topic)}</h1>
      <p className="mt-3 mb-8 leading-7 text-zinc-700 dark:text-zinc-300">
        Answer out loud, check yourself, and be honest with the rating. Questions you miss come back first.
      </p>
      <PracticeView topic={topic} questions={questions} quizPool={quizPoolFor(topic)} />
    </main>
  );
}
