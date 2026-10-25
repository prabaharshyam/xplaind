"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { clearAttempt, parseAttempt, rawAttempt, serverSnapshot, subscribe } from "@/lib/browser/attempt-store";
import { type LevelId, levelIndex } from "@/lib/levels";
import { hoursFromLevel, weeksAtPace } from "@/lib/placement/estimate";
import { scoreAnswers } from "@/lib/placement/score";
import type { PublicQuestion } from "@/lib/placement/types";
import { splitStem, tagLabel } from "@/lib/text";

type LevelInfo = { id: LevelId; name: string; can_do: string; draft_hours: number; exit_check: string };
type StopInfo = { id: string; title: string; level: LevelId; gap_tags: string[] };

const linkButton =
  "inline-flex min-h-12 items-center justify-center rounded-lg px-5 py-3 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700";

export function ResultView({ levels, stops, bank }: { levels: LevelInfo[]; stops: StopInfo[]; bank: PublicQuestion[] }) {
  const raw = useSyncExternalStore(subscribe, rawAttempt, serverSnapshot);
  const attempt = useMemo(() => parseAttempt(raw), [raw]);
  const result = useMemo(() => (attempt ? scoreAnswers(attempt.answers) : null), [attempt]);

  if (raw === null && attempt === null) {
    // Nothing saved, or still reading the browser's storage on first paint.
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Your level</h1>
        <p className="leading-7 text-zinc-700 dark:text-zinc-300">
          There is no saved result on this device yet. The test takes five to ten minutes.
        </p>
        <Link href="/start" className={`${linkButton} bg-emerald-700 text-white hover:bg-emerald-800`}>
          Find my level
        </Link>
      </div>
    );
  }
  if (!attempt || !result) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Your level</h1>
        <p className="leading-7">We could not read the saved result. Please take the test again.</p>
        <Link href="/start" className={`${linkButton} bg-emerald-700 text-white hover:bg-emerald-800`}>
          Find my level
        </Link>
      </div>
    );
  }

  const byId = new Map(levels.map((l) => [l.id, l]));
  const start = byId.get(result.startLevel);
  const passed = result.passedLevel ? byId.get(result.passedLevel) : null;
  const hours = hoursFromLevel(levels, result.startLevel);
  const weeks = weeksAtPace(hours, attempt.weeklyHours);
  const questions = new Map(bank.map((q) => [q.id, q]));
  const missed = attempt.answers.filter((a) => !a.correct && questions.has(a.questionId));

  /** The easiest stop at or below the start level that covers a gap tag. */
  const stopFor = (tag: string) =>
    stops
      .filter((s) => levelIndex(s.level) <= levelIndex(result.startLevel) && s.gap_tags.includes(tag))
      .sort((a, b) => levelIndex(a.level) - levelIndex(b.level))[0];

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="result-heading" className="flex flex-col gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Your result</p>
        <h1 id="result-heading" className="text-3xl font-semibold tracking-tight text-balance">
          {result.topOfLadder
            ? `You are at the top of the ladder: ${start?.name}`
            : `Start at ${result.startLevel}: ${start?.name}`}
        </h1>
        <p className="leading-7 text-zinc-700 dark:text-zinc-300">
          {passed
            ? `You passed ${passed.id} (${passed.name}). `
            : "You did not pass a level yet, which is a fine place to start. "}
          {result.topOfLadder
            ? "There is no level above P3, so use this path to sharpen what you know and practise for interviews."
            : `That puts your first step at ${result.startLevel}.`}
        </p>
        {start && (
          <p className="rounded-lg bg-zinc-100 p-4 leading-7 dark:bg-zinc-900">
            <span className="font-medium">At {start.id} you work towards:</span> {start.can_do}.
          </p>
        )}
      </section>

      <section aria-labelledby="time-heading" className="flex flex-col gap-2">
        <h2 id="time-heading" className="text-xl font-semibold">
          How long it takes
        </h2>
        <p className="leading-7">
          About <strong>{hours} hours</strong> of material from {result.startLevel} to P3. At{" "}
          {attempt.weeklyHours} hours a week that is about <strong>{weeks} weeks</strong>.
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          These hours are early estimates. We will replace them with real numbers after the first learners finish.
        </p>
      </section>

      <section aria-labelledby="gaps-heading" className="flex flex-col gap-3">
        <h2 id="gaps-heading" className="text-xl font-semibold">
          What to review first
        </h2>
        {result.gaps.length === 0 ? (
          <p className="leading-7">No gaps stood out. Go straight to your first step.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {result.gaps.map((tag) => {
              const stop = stopFor(tag);
              return (
                <li key={tag} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                  <p className="font-medium">{tagLabel(tag)}</p>
                  {stop ? (
                    <Link
                      href={`/stop/${stop.id}`}
                      className="text-emerald-800 underline underline-offset-2 dark:text-emerald-400"
                    >
                      Review: {stop.title}
                    </Link>
                  ) : (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">A review step for this topic is coming.</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {missed.length > 0 && (
        <section aria-labelledby="missed-heading" className="flex flex-col gap-3">
          <h2 id="missed-heading" className="text-xl font-semibold">
            Questions to learn from
          </h2>
          {missed.map((a) => {
            const q = questions.get(a.questionId)!;
            const { text } = splitStem(q.stem);
            const right = q.options.find((o) => o.id === q.correct);
            return (
              <details key={a.questionId} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                <summary className="min-h-8 cursor-pointer font-medium">{text}</summary>
                <p className="mt-2">
                  <span className="font-medium">Answer:</span> {right?.text}
                </p>
                <p className="mt-1 leading-7 text-zinc-700 dark:text-zinc-300">{q.explanation}</p>
              </details>
            );
          })}
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/start"
          onClick={() => clearAttempt()}
          className={`${linkButton} border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900`}
        >
          Take the test again
        </Link>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Taken on {attempt.completedOn}. This result is saved on this device only.
      </p>
    </div>
  );
}
