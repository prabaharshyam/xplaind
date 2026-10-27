"use client";

import { useState } from "react";

/** "Try it": answer the questions first, then reveal the answers. */
export function LessonExercise({ setup, questions }: { setup: string; questions: { q: string; a: string }[] }) {
  const [shown, setShown] = useState(false);
  return (
    <div>
      <p className="mt-2 leading-7">{setup}</p>
      <p className="mt-4 text-sm font-medium">Answer these before you check:</p>
      <ol className="mt-2 list-decimal space-y-2 pl-6 leading-7">
        {questions.map((x) => (
          <li key={x.q}>{x.q}</li>
        ))}
      </ol>
      {shown ? (
        <div className="mt-5 rounded-xl bg-white p-4 dark:bg-zinc-950" role="region" aria-label="Answers">
          <p className="font-semibold">Check your answers</p>
          <ol className="mt-2 list-decimal space-y-2 pl-6 leading-7">
            {questions.map((x) => (
              <li key={x.q}>{x.a}</li>
            ))}
          </ol>
          <button type="button" onClick={() => setShown(false)} className="mt-3 text-sm underline underline-offset-2">
            Hide the answers
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setShown(true)} className="mt-5 min-h-11 rounded-full bg-zinc-900 px-5 font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
          Check your answers
        </button>
      )}
    </div>
  );
}
