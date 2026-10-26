"use client";

import { type ReactNode, useState } from "react";
import { checkPercent } from "@/lib/roadmap/progress";
import { splitStem } from "@/lib/text";
import { muted, primaryButton, secondaryButton } from "./ui";

export type McqQuestion = {
  id: string;
  stem: string;
  options: { id: string; text: string }[];
  correct: string;
  explanation: string;
};

/** A set of multiple-choice questions, graded in the browser (the answers ship with the page: no stakes). */
export function McqQuiz({
  questions,
  intro,
  verdict,
  retryLabel,
  onScored,
}: {
  questions: McqQuestion[];
  intro: ReactNode;
  /** The sentence after "You scored N%." */
  verdict: (percent: number) => string;
  retryLabel: string;
  onScored?: (percent: number) => void;
}) {
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [result, setResult] = useState<number | null>(null);
  const complete = questions.every((q) => chosen[q.id]);

  function submit() {
    const correct = questions.filter((q) => chosen[q.id] === q.correct).length;
    const percent = checkPercent(correct, questions.length);
    setResult(percent);
    onScored?.(percent);
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <p className="leading-7">{intro}</p>
      {questions.map((q, n) => {
        const { text, code } = splitStem(q.stem);
        return (
          <fieldset key={q.id} className="flex min-w-0 flex-col gap-2">
            <legend className="mb-2 font-medium">
              {n + 1}. {text}
            </legend>
            {code && (
              <pre tabIndex={0} aria-label="Code" className="overflow-x-auto rounded-lg bg-zinc-100 p-3 font-mono text-sm leading-6 dark:bg-zinc-900">
                <code>{code}</code>
              </pre>
            )}
            {q.options.map((o) => {
              const shownRight = result !== null && o.id === q.correct;
              const shownWrong = result !== null && chosen[q.id] === o.id && o.id !== q.correct;
              return (
                <label
                  key={o.id}
                  className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border border-zinc-300 p-3 has-[:checked]:border-emerald-700 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-emerald-700 dark:border-zinc-700"
                >
                  <input
                    type="radio"
                    name={`check-${q.id}`}
                    className="mt-1.5 size-4 accent-emerald-700"
                    checked={chosen[q.id] === o.id}
                    disabled={result !== null}
                    onChange={() => setChosen((c) => ({ ...c, [q.id]: o.id }))}
                  />
                  <span>
                    {o.text}
                    {shownRight && <span className="font-medium text-emerald-800 dark:text-emerald-400"> (right answer)</span>}
                    {shownWrong && <span className="font-medium text-red-800 dark:text-red-400"> (your answer)</span>}
                  </span>
                </label>
              );
            })}
            {result !== null && <p className={`text-sm leading-6 ${muted}`}>{q.explanation}</p>}
          </fieldset>
        );
      })}
      {result === null ? (
        <button type="submit" className={primaryButton} disabled={!complete}>
          Check my answers
        </button>
      ) : (
        <div className="flex flex-col gap-3" role="status">
          <p className="text-lg font-medium">
            You scored {result}%. {verdict(result)}
          </p>
          <button
            type="button"
            className={secondaryButton}
            onClick={() => {
              setChosen({});
              setResult(null);
            }}
          >
            {retryLabel}
          </button>
        </div>
      )}
    </form>
  );
}
