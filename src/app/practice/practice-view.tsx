"use client";

import Link from "next/link";
import { useState } from "react";
import { Flashcard } from "@/components/interview/flashcard";
import { McqQuiz, type McqQuestion } from "@/components/mcq-quiz";
import { muted, primaryButton, secondaryButton } from "@/components/ui";
import { usePractice, useToday } from "@/lib/browser/hooks";
import { rate } from "@/lib/browser/practice-store";
import { todayInIST } from "@/lib/dates";
import { INTERVIEW_TOPICS } from "@/lib/interview-topics";
import type { InterviewView } from "@/lib/interview/types";
import { type Rating, practiceOrder, summarise } from "@/lib/practice/queue";

const QUIZ_SIZE = 5;

/** Picks n random items. Called from event handlers only, so server and client renders match. */
function sample<T>(items: readonly T[], n: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export function PracticeView({
  topic,
  questions,
  quizPool,
}: {
  topic: string | null;
  questions: InterviewView[];
  quizPool: McqQuestion[];
}) {
  return (
    <div className="flex flex-col gap-10">
      <nav aria-label="Practice topics">
        <ul className="flex flex-wrap gap-2">
          {[{ id: null, label: "All topics" }, ...INTERVIEW_TOPICS].map((t) => {
            const active = t.id === topic;
            return (
              <li key={t.id ?? "all"}>
                <Link
                  href={t.id ? `/practice/${t.id}` : "/practice"}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 ${
                    active
                      ? "border-brand-700 bg-brand-700 text-white"
                      : "border-zinc-300 hover:border-zinc-500 dark:border-zinc-700"
                  }`}
                >
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <Flashcards questions={questions} />
      {quizPool.length > 0 && <QuickQuiz pool={quizPool} />}
    </div>
  );
}

/** IQ-4: question, think, short answer, deeper answer, then a rating. */
function Flashcards({ questions }: { questions: InterviewView[] }) {
  const practice = usePractice();
  const today = useToday();
  const [queue, setQueue] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const ids = questions.map((q) => q.id);
  const summary = summarise(ids, practice.ratings);
  const byId = new Map(questions.map((q) => [q.id, q]));

  function start() {
    setQueue(practiceOrder(ids, practice.ratings));
    setIndex(0);
  }

  function next(rating: Rating) {
    const id = queue![index];
    if (!rate(id, { rating, updatedOn: today ?? todayInIST() })) return; // SU-2: the sign-up prompt opens
    setIndex(index + 1); // the new card takes focus itself
  }

  return (
    <section aria-labelledby="flashcards-heading" className="flex flex-col gap-4">
      <h2 id="flashcards-heading" className="text-xl font-semibold">
        Interview questions
      </h2>
      <p className={`text-sm ${muted}`}>
        {summary.rated} of {summary.total} practiced: {summary.gotIt} got it, {summary.partly} partly, {summary.missed}{" "}
        missed. Ratings are saved on this device.
      </p>

      {queue === null ? (
        <button type="button" className={primaryButton} onClick={start}>
          {summary.rated > 0 ? "Continue practicing" : "Start practicing"}
        </button>
      ) : index >= queue.length ? (
        <div className="flex flex-col gap-3" role="status">
          <p className="text-lg font-medium">Round done. Missed and partly-known questions come first next time.</p>
          <button type="button" className={secondaryButton} onClick={start}>
            Start another round
          </button>
        </div>
      ) : (
        <Flashcard key={queue[index]} q={byId.get(queue[index])!} index={index} total={queue.length} onRate={next} />
      )}
    </section>
  );
}

/** IQ-5: a standalone MCQ set drawn from the lessons behind this topic. */
function QuickQuiz({ pool }: { pool: McqQuestion[] }) {
  const [round, setRound] = useState<McqQuestion[] | null>(null);
  const [key, setKey] = useState(0);
  const newRound = () => {
    setRound(sample(pool, QUIZ_SIZE));
    setKey((k) => k + 1);
  };

  return (
    <section aria-labelledby="quiz-heading" className="flex flex-col gap-4">
      <h2 id="quiz-heading" className="text-xl font-semibold">
        Quick quiz
      </h2>
      <p className={`text-sm ${muted}`}>
        {Math.min(QUIZ_SIZE, pool.length)} multiple-choice questions at a time, from {pool.length} on the lessons behind
        these topics.
      </p>
      {round === null ? (
        <button type="button" className={secondaryButton} onClick={newRound}>
          Start a quiz
        </button>
      ) : (
        <>
          <McqQuiz
            key={key}
            questions={round}
            intro="Pick one answer for each question."
            verdict={(p) => (p >= 80 ? "Strong." : p >= 50 ? "Getting there." : "Worth revisiting the lessons.")}
            retryLabel="Try these again"
          />
          <button type="button" className={secondaryButton} onClick={newRound}>
            New questions
          </button>
        </>
      )}
    </section>
  );
}
