"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  clearTest,
  parseTest,
  rawTest,
  saveAttempt,
  saveTest,
  serverSnapshot,
  subscribe,
} from "@/lib/browser/attempt-store";
import { setPath } from "@/lib/browser/progress-store";
import { todayInIST } from "@/lib/dates";
import { DEFAULT_WEEKLY_HOURS, WEEKLY_HOUR_CHOICES } from "@/lib/placement/estimate";
import { currentQuestion, startTest, submitAnswer, TEST_LENGTH } from "@/lib/placement/select";
import type { PublicQuestion } from "@/lib/placement/types";
import { splitStem } from "@/lib/text";

const IDK = "__idk__";

const button =
  "inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-700 px-5 py-3 font-medium text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50";

export function PlacementTest({ goal, bank }: { goal: { id: string; name: string }; bank: PublicQuestion[] }) {
  const router = useRouter();
  // The test lives in the browser's storage, so a refresh keeps the learner's place.
  const raw = useSyncExternalStore(subscribe, rawTest, serverSnapshot);
  const test = useMemo(() => parseTest(raw), [raw]);
  const [weeklyHours, setWeeklyHours] = useState<number>(DEFAULT_WEEKLY_HOURS);
  const [selected, setSelected] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const question = test ? currentQuestion(test.state, bank) : null;
  const answered = test?.state.answers.length ?? 0;

  // Move focus to the new question so keyboard and screen-reader users land on it.
  useEffect(() => {
    if (question) headingRef.current?.focus();
  }, [question?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function begin() {
    saveTest({ goal: goal.id, weeklyHours, state: startTest(bank, Math.random) });
    setSelected(null);
  }

  function next() {
    if (!test || !question || selected === null) return;
    const state = submitAnswer(test.state, bank, selected === IDK ? null : selected, Math.random);
    setSelected(null);
    if (state.done) {
      saveAttempt({
        version: 1,
        goal: test.goal,
        weeklyHours: test.weeklyHours,
        completedOn: todayInIST(),
        answers: state.answers,
      });
      clearTest();
      setPath(test.goal);
      router.push("/result");
    } else {
      saveTest({ ...test, state });
    }
  }

  // ---- step 1: goal and weekly hours --------------------------------------
  if (!test || !question) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">Find my level</h1>
          <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
            About {TEST_LENGTH} multiple-choice questions, five to ten minutes. They get harder when you
            are right and easier when you are not, so it is fine to say <em>I don&apos;t know</em>.
            No sign-up, and your answers stay on this device.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Your path</p>
          <p className="font-medium">{goal.name}</p>
          <Link href="/paths" className="text-sm text-emerald-800 underline underline-offset-2 dark:text-emerald-400">
            Choose a different path
          </Link>
        </div>

        <fieldset>
          <legend className="font-medium">How many hours a week can you study?</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {WEEKLY_HOUR_CHOICES.map((h) => (
              <label
                key={h}
                className="flex min-h-12 min-w-16 cursor-pointer items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 has-[:checked]:border-emerald-700 has-[:checked]:bg-emerald-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-emerald-700 dark:border-zinc-700 dark:has-[:checked]:bg-emerald-950"
              >
                <input
                  type="radio"
                  name="weekly-hours"
                  className="sr-only"
                  checked={weeklyHours === h}
                  onChange={() => setWeeklyHours(h)}
                />
                {h} hours
              </label>
            ))}
          </div>
        </fieldset>

        <button type="button" className={button} onClick={begin} disabled={bank.length === 0}>
          Start the test
        </button>
      </div>
    );
  }

  // ---- step 2: one question at a time -------------------------------------
  const { text, code } = splitStem(question.stem);
  const options = [...question.options.map((o) => ({ id: o.id, text: o.text })), { id: IDK, text: "I don't know" }];

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        next();
      }}
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
        Question {answered + 1} of up to {TEST_LENGTH}
      </p>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
        role="progressbar"
        aria-label="Test progress"
        aria-valuemin={0}
        aria-valuemax={TEST_LENGTH}
        aria-valuenow={answered}
      >
        <div className="h-full bg-emerald-700" style={{ width: `${(answered / TEST_LENGTH) * 100}%` }} />
      </div>

      <fieldset className="flex min-w-0 flex-col gap-3" key={question.id}>
        <legend className="mb-3">
          <h1 ref={headingRef} tabIndex={-1} className="text-xl leading-8 font-semibold outline-none">
            {text}
          </h1>
        </legend>
        {code && (
          <pre
            tabIndex={0}
            aria-label="Code"
            className="overflow-x-auto rounded-lg bg-zinc-100 p-3 font-mono text-sm leading-6 dark:bg-zinc-900"
          >
            <code>{code}</code>
          </pre>
        )}
        {options.map((o) => (
          <label
            key={o.id}
            className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border border-zinc-300 p-3 has-[:checked]:border-emerald-700 has-[:checked]:bg-emerald-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-emerald-700 dark:border-zinc-700 dark:has-[:checked]:bg-emerald-950"
          >
            <input
              type="radio"
              name="answer"
              className="mt-1.5 size-4 accent-emerald-700"
              checked={selected === o.id}
              onChange={() => setSelected(o.id)}
            />
            <span className={o.id === IDK ? "text-zinc-600 dark:text-zinc-400" : undefined}>{o.text}</span>
          </label>
        ))}
      </fieldset>

      <button type="submit" className={button} disabled={selected === null}>
        {answered + 1 >= TEST_LENGTH ? "Finish" : "Next"}
      </button>
    </form>
  );
}
