"use client";

import { type ReactNode, useState } from "react";
import { checkPercent } from "@/lib/roadmap/progress";
import { splitStem } from "@/lib/text";
import { primaryButton, secondaryButton } from "./ui";

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
              <pre tabIndex={0} aria-label="Code" className="overflow-x-auto rounded-2xl bg-zinc-100 p-3 font-mono text-sm leading-6 dark:bg-zinc-900">
                <code>{code}</code>
              </pre>
            )}
            {/* APP-2 (StudyFetch's answer rows, in our colours): each option is a row with its letter as a small key; the
                chosen row fills, and after checking the right row turns green and a wrong pick rose. The radio stays for
                keyboard and screen readers, drawn as the letter (it sits on top of it, invisible). */}
            {q.options.map((o, k) => {
              const shownRight = result !== null && o.id === q.correct;
              const shownWrong = result !== null && chosen[q.id] === o.id && o.id !== q.correct;
              const tone = shownRight
                ? "border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40"
                : shownWrong
                  ? "border-rose-600 bg-rose-50 dark:border-rose-500 dark:bg-rose-950/40"
                  : "border-zinc-200 bg-white hover:border-zinc-400 hover:bg-[var(--hero)] has-[:checked]:border-brand-700 has-[:checked]:bg-brand-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-white/5 dark:has-[:checked]:border-brand-300 dark:has-[:checked]:bg-brand-950/50";
              return (
                <label
                  key={o.id}
                  className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-700 ${tone}`}
                >
                  <span className="relative grid size-8 shrink-0">
                    <input
                      type="radio"
                      name={`check-${q.id}`}
                      className="peer absolute inset-0 size-8 cursor-pointer appearance-none rounded-full"
                      checked={chosen[q.id] === o.id}
                      disabled={result !== null}
                      onChange={() => setChosen((c) => ({ ...c, [q.id]: o.id }))}
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none grid size-8 place-items-center rounded-full bg-zinc-100 font-mono text-sm font-semibold text-zinc-700 peer-checked:bg-brand-700 peer-checked:text-white dark:bg-zinc-800 dark:text-zinc-200 dark:peer-checked:bg-brand-300 dark:peer-checked:text-brand-950"
                    >
                      {"ABCDEFGH"[k]}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    {o.text}
                    {shownRight && <span className="font-medium text-emerald-800 dark:text-emerald-400"> (right answer)</span>}
                    {shownWrong && <span className="font-medium text-rose-800 dark:text-rose-400"> (your answer)</span>}
                  </span>
                </label>
              );
            })}
            {result !== null && (
              <p className={`rounded-2xl p-3 text-sm leading-6 ${chosen[q.id] === q.correct ? "bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100" : "bg-zinc-50 dark:bg-zinc-900"}`}>
                {q.explanation}
              </p>
            )}
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
