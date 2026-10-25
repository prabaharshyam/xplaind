import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DraftNote } from "@/components/draft-note";
import { muted, textLink } from "@/components/ui";
import { getInterviewView, getInterviewViews } from "@/lib/content/interview";
import { interviewTopicLabel } from "@/lib/interview-topics";

export function generateStaticParams() {
  return getInterviewViews().map((q) => ({ id: q.id }));
}

export async function generateMetadata({ params }: PageProps<"/interview/[id]">): Promise<Metadata> {
  const q = getInterviewView((await params).id);
  return q ? { title: q.question, description: q.short_answer } : {};
}

export default async function InterviewQuestionPage({ params }: PageProps<"/interview/[id]">) {
  const q = getInterviewView((await params).id);
  if (!q) notFound();
  const sameTopic = getInterviewViews().filter((o) => o.topic === q.topic && o.id !== q.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/interview" className={textLink}>
          Interview questions
        </Link>
        <span className={muted}> / {interviewTopicLabel(q.topic)}</span>
      </nav>
      <h1 className="mt-4 text-2xl leading-9 font-semibold tracking-tight text-balance">{q.question}</h1>
      <p className={`mt-2 text-sm ${muted}`}>
        {interviewTopicLabel(q.topic)} · level {q.level}
      </p>
      {!q.reviewed && (
        <div className="mt-4">
          <DraftNote />
        </div>
      )}

      <h2 className="mt-8 text-xl font-semibold">Short answer</h2>
      <p className="mt-2 rounded-lg bg-zinc-100 p-4 leading-7 dark:bg-zinc-900">{q.short_answer}</p>

      <h2 className="mt-8 text-xl font-semibold">Deeper answer</h2>
      {q.deeper_answer.split(/\n\s*\n/).map((para, i) => (
        <p key={i} className="mt-3 leading-7">
          {para}
        </p>
      ))}

      <h2 className="mt-8 text-xl font-semibold">Follow-ups to expect</h2>
      <ul className="mt-2 list-disc pl-6 leading-7 [&_li]:mt-1">
        {q.follow_ups.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Common mistakes</h2>
      <ul className="mt-2 list-disc pl-6 leading-7 [&_li]:mt-1">
        {q.common_mistakes.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Learn it</h2>
      <p className="mt-2 leading-7">
        <Link href={`/stop/${q.stop.id}`} className={textLink}>
          {q.stop.title}
        </Link>
      </p>

      <div className="mt-8 flex flex-col gap-2">
        <Link href={`/practice/${q.topic}`} className={textLink}>
          Practise {interviewTopicLabel(q.topic)} questions
        </Link>
        {sameTopic.length > 0 && (
          <>
            <h2 className="mt-6 text-lg font-semibold">More on this topic</h2>
            <ul className="flex flex-col gap-1">
              {sameTopic.map((o) => (
                <li key={o.id}>
                  <Link href={`/interview/${o.id}`} className={textLink}>
                    {o.question}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
