"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CodeRunner } from "@/components/playground/code-runner";
import { Icon } from "@/components/art/icons";
import { decodeCode, EXAMPLE_GROUPS, EXAMPLES } from "@/lib/playground/examples";

/** PG-2 and PG-5: pick a starter program, edit it and run it. A lesson can hand over its code in the link. */
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

  const button = (on: boolean) =>
    `min-h-11 rounded-2xl border px-3 py-2 text-left text-sm font-medium lg:w-full ${on ? "border-2 border-violet-600 bg-violet-50 dark:bg-violet-950" : "border-zinc-200 bg-white hover:border-violet-300 dark:border-zinc-800 dark:bg-zinc-900"}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <nav aria-label="Starter programs" className="lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto lg:pr-1" data-lenis-prevent>
        {shared && (
          <button type="button" aria-pressed className={`${button(true)} mb-4`}>
            Code from the lesson
          </button>
        )}
        {/* PG-5: starters in three groups, from a five-line warm-up to a challenge. */}
        <div className="flex flex-col gap-5">
          {EXAMPLE_GROUPS.map((g) => (
            <section key={g.id} aria-labelledby={`pg-${g.id}`}>
              <h2 id={`pg-${g.id}`} className="text-sm font-semibold text-zinc-900 dark:text-white">
                {g.title}
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">{g.note}</p>
              <ul className="mt-2 flex flex-wrap gap-2 lg:flex-col">
                {EXAMPLES.filter((e) => e.group === g.id).map((e) => {
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
                        className={button(on)}
                      >
                        {e.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </nav>
      <div className="min-w-0">
        {!shared && (
          <p className="mb-3 flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-amber-950 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-900">
            <Icon name="bolt" size={18} className="mt-0.5 shrink-0" />
            <span>
              <strong className="font-semibold">Try this:</strong> {example.tip}
            </span>
          </p>
        )}
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
