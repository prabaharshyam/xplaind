"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { muted, primaryButton, secondaryButton, textLink } from "@/components/ui";
import type { InterviewView } from "@/lib/interview/types";
import { levelText } from "@/lib/levels";
import { RATINGS, type Rating } from "@/lib/practice/queue";
import { useShortcut } from "@/lib/browser/keys";

export type Card = Pick<InterviewView, "id" | "question" | "short_answer" | "deeper_answer" | "level">;

/**
 * IQ-4: one card of a deck: the question, then the short answer, the deeper answer and a rating.
 * Render it with key={q.id}, so each card starts on its question side.
 */
export function Flashcard({
  q,
  index,
  total,
  onRate,
  extra,
  note,
}: {
  q: Card;
  index: number;
  total: number;
  onRate: (rating: Rating) => void;
  extra?: ReactNode;
  /** PREP-6: for a question that is not in the bank: shown in place of its level, and it has no page to link to. */
  note?: string;
}) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  // Each step removes the button that was pressed, so move focus to what it revealed (keyboard and screen-reader users).
  const question = useRef<HTMLHeadingElement>(null);
  const deeper = useRef<HTMLHeadingElement>(null);
  useEffect(() => (stage === 2 ? deeper : question).current?.focus(), [stage]);
  // APP-2: Space turns the card (question, short answer, deeper answer); 1 to 3 rate it once it is turned.
  const ordered = [...RATINGS].reverse();
  useShortcut((key) => {
    if (key === " " && stage < 2) {
      setStage((stage + 1) as 1 | 2);
      return true;
    }
    const n = Number(key);
    if (stage >= 1 && n >= 1 && n <= ordered.length) {
      onRate(ordered[n - 1].value);
      return true;
    }
  });
  const done = Math.round((index / total) * 100);
  return (
    <div className="flex flex-col gap-4">
      {/* Progress through the deck. */}
      <div className="flex items-center gap-3 text-sm">
        <span className={muted}>
          Card {index + 1} of {total}
        </span>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800" aria-hidden="true">
          <span className="block h-full rounded-full bg-brand-700 transition-[width] duration-300" style={{ width: `${done}%` }} />
        </span>
      </div>
      {/* A deck: the card on top, with two cards peeking out behind it. */}
      <div className="relative pb-3">
        <span aria-hidden="true" className="absolute inset-x-6 bottom-0 h-full rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
        <span aria-hidden="true" className="absolute inset-x-3 bottom-1.5 h-full rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
        <article
          key={stage > 0 ? "back" : "front"}
          className="card-flip relative flex min-h-72 min-w-0 flex-col gap-4 [overflow-wrap:anywhere] rounded-2xl border border-zinc-200 bg-white p-6 md:p-8 dark:border-zinc-800 dark:bg-zinc-900"
          aria-labelledby="card-question"
        >
          <p className="flex items-center justify-between gap-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <span>{stage === 0 ? "Question" : "Answer"}</span>
            <span>{note ?? levelText(q.level)}</span>
          </p>
          <h3
            id="card-question"
            ref={question}
            tabIndex={-1}
            className={`leading-snug font-semibold outline-none ${stage === 0 ? "my-auto py-6 text-center text-2xl" : "text-lg text-zinc-600 dark:text-zinc-300"}`}
          >
            {q.question}
          </h3>
          {stage === 0 ? (
            <div className="mt-auto flex flex-col items-center gap-3">
              <p className={`text-sm ${muted}`}>Say your answer out loud first, then flip the card.</p>
              <button type="button" className={primaryButton} aria-keyshortcuts="Space" onClick={() => setStage(1)}>
                Show the short answer <kbd aria-hidden="true" className="xp-key">Space</kbd>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-lg leading-8">{q.short_answer}</p>
              {stage === 1 ? (
                <button type="button" className={`${secondaryButton} self-start`} aria-keyshortcuts="Space" onClick={() => setStage(2)}>
                  Show the deeper answer <kbd aria-hidden="true" className="xp-key">Space</kbd>
                </button>
              ) : (
                <div className="flex flex-col gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                  <h4 ref={deeper} tabIndex={-1} className="font-semibold outline-none">
                    Deeper answer
                  </h4>
                  {q.deeper_answer.split(/\n\s*\n/).map((para, i) => (
                    <p key={i} className="leading-7">
                      {para}
                    </p>
                  ))}
                </div>
              )}
              {!note && (
                <Link href={`/interview/${q.id}`} className={`text-sm ${textLink}`}>
                  Full answer, follow-ups and common mistakes
                </Link>
              )}
              {extra}
            </div>
          )}
        </article>
      </div>
      {stage >= 1 && (
        <fieldset className="flex min-w-0 flex-col gap-2">
          <legend className="mb-2 font-medium">How did you do?</legend>
          <div className="grid grid-cols-3 gap-2">
            {ordered.map((r, k) => (
              <button key={r.value} type="button" className={secondaryButton} aria-keyshortcuts={String(k + 1)} onClick={() => onRate(r.value)}>
                {r.label} <kbd aria-hidden="true" className="xp-key">{k + 1}</kbd>
              </button>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
