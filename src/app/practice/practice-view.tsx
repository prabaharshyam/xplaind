"use client";

import Link from "next/link";
import { useState } from "react";
import { DraftNote } from "@/components/draft-note";
import { McqQuiz, type McqQuestion } from "@/components/mcq-quiz";
import { muted, primaryButton, secondaryButton, textLink } from "@/components/ui";
import { usePractice, useToday } from "@/lib/browser/hooks";
import { rate } from "@/lib/browser/practice-store";
import { todayInIST } from "@/lib/dates";
import { INTERVIEW_TOPICS } from "@/lib/interview-topics";
import type { InterviewView } from "@/lib/interview/types";
import { RATINGS, type Rating, practiceOrder, summarise } from "@/lib/practice/queue";

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
                  className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 ${
                    active
                      ? "border-violet-700 bg-violet-700 text-white"
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
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const ids = questions.map((q) => q.id);
  const summary = summarise(ids, practice.ratings);
  const byId = new Map(questions.map((q) => [q.id, q]));

  function start() {
    setQueue(practiceOrder(ids, practice.ratings));
    setIndex(0);
    setStage(0);
  }

  function next(rating: Rating) {
    const id = queue![index];
    if (!rate(id, { rating, updatedOn: today ?? todayInIST() })) return; // SU-2: the sign-up prompt opens
    setIndex(index + 1);
    setStage(0);
    // Move focus to the new question for keyboard and screen-reader users.
    requestAnimationFrame(() => document.getElementById("card-question")?.focus());
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
        (() => {
          const q = byId.get(queue[index])!;
          const done = Math.round((index / queue.length) * 100);
          return (
            <div className="flex flex-col gap-4">
              {/* Progress through the deck. */}
              <div className="flex items-center gap-3 text-sm">
                <span className={muted}>
                  Card {index + 1} of {queue.length}
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800" aria-hidden="true">
                  <span className="block h-full rounded-full bg-violet-700 transition-[width] duration-300" style={{ width: `${done}%` }} />
                </span>
              </div>
              {/* A deck: the card on top, with two cards peeking out behind it. */}
              <div className="relative pb-3">
                <span aria-hidden="true" className="absolute inset-x-6 bottom-0 h-full rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
                <span aria-hidden="true" className="absolute inset-x-3 bottom-1.5 h-full rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
                <article
                  key={`${q.id}-${stage > 0 ? "back" : "front"}`}
                  className="card-flip relative flex min-h-72 flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-lg shadow-zinc-950/5 md:p-8 dark:border-zinc-800 dark:bg-zinc-900"
                  aria-labelledby="card-question"
                >
                  <p className="flex items-center justify-between gap-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                    <span>{stage === 0 ? "Question" : "Answer"}</span>
                    <span>Level {q.level}</span>
                  </p>
                  <h3
                    id="card-question"
                    tabIndex={-1}
                    className={`leading-snug font-semibold outline-none ${stage === 0 ? "my-auto py-6 text-center text-2xl" : "text-lg text-zinc-600 dark:text-zinc-300"}`}
                  >
                    {q.question}
                  </h3>
                  {!q.reviewed && <DraftNote />}
                  {stage === 0 ? (
                    <div className="mt-auto flex flex-col items-center gap-3">
                      <p className={`text-sm ${muted}`}>Say your answer out loud first, then flip the card.</p>
                      <button type="button" className={primaryButton} onClick={() => setStage(1)}>
                        Show the short answer
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <p className="text-lg leading-8">{q.short_answer}</p>
                      {stage === 1 ? (
                        <button type="button" className={`${secondaryButton} self-start`} onClick={() => setStage(2)}>
                          Show the deeper answer
                        </button>
                      ) : (
                        <div className="flex flex-col gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                          <h4 className="font-semibold">Deeper answer</h4>
                          {q.deeper_answer.split(/\n\s*\n/).map((para, i) => (
                            <p key={i} className="leading-7">
                              {para}
                            </p>
                          ))}
                        </div>
                      )}
                      <Link href={`/interview/${q.id}`} className={`text-sm ${textLink}`}>
                        Full answer, follow-ups and common mistakes
                      </Link>
                    </div>
                  )}
                </article>
              </div>
              {stage >= 1 && (
                <fieldset className="flex min-w-0 flex-col gap-2">
                  <legend className="mb-2 font-medium">How did you do?</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {[...RATINGS].reverse().map((r) => (
                      <button key={r.value} type="button" className={secondaryButton} onClick={() => next(r.value)}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
            </div>
          );
        })()
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
