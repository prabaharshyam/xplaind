"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CodeRunner } from "@/components/playground/code-runner";
import { decodeCode, EXAMPLES } from "@/lib/playground/examples";

/** PG-2: pick a starter program, edit it and run it. A lesson can hand over its code in the link. */
export function PlaygroundStudio({ aiOn, lessonTitles }: { aiOn: boolean; lessonTitles: Record<string, string> }) {
  const [pick, setPick] = useState(EXAMPLES[0].id);
  const [shared, setShared] = useState<string | null>(null);

  useEffect(() => {
    const m = /code=([^&]+)/.exec(window.location.hash);
    const code = m ? decodeCode(m[1]) : null;
    // Read once, after the page has painted, from the link a lesson opened.
    if (code) queueMicrotask(() => setShared(code));
  }, []);

  const example = EXAMPLES.find((e) => e.id === pick) ?? EXAMPLES[0];
  const code = shared ?? example.code;

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <nav aria-label="Starter programs" className="lg:sticky lg:top-20 lg:self-start">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400">Try a starter</h2>
        <ul className="mt-3 flex flex-wrap gap-2 lg:flex-col">
          {shared && (
            <li>
              <button type="button" aria-pressed className="min-h-10 rounded-xl border-2 border-violet-600 lg:w-full bg-violet-50 px-3 py-2 text-left text-sm font-medium dark:bg-violet-950">
                Code from the lesson
              </button>
            </li>
          )}
          {EXAMPLES.map((e) => {
            const on = !shared && e.id === pick;
            return (
              <li key={e.id} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setShared(null);
                    setPick(e.id);
                    history.replaceState(null, "", window.location.pathname);
                  }}
                  className={`min-h-10 rounded-xl border px-3 py-2 lg:w-full text-left text-sm font-medium ${on ? "border-2 border-violet-600 bg-violet-50 dark:bg-violet-950" : "border-zinc-200 bg-white hover:border-violet-300 dark:border-zinc-800 dark:bg-zinc-900"}`}
                >
                  {e.title}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="min-w-0">
        <CodeRunner key={shared ? "shared" : pick} initialCode={code} aiOn={aiOn} label={shared ? "Code from the lesson" : example.title} />
        {!shared && example.lesson && lessonTitles[example.lesson] && (
          <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
            Learn the idea behind it:{" "}
            <Link href={`/stop/${example.lesson}`} className="font-medium text-violet-800 underline underline-offset-2 dark:text-violet-300">
              {lessonTitles[example.lesson]}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
