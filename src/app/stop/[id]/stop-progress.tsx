"use client";

import Link from "next/link";
import { useState } from "react";
import { muted, primaryButton, secondaryButton, textLink } from "@/components/ui";
import { useProgress, useToday } from "@/lib/browser/hooks";
import { clearStop, setStop } from "@/lib/browser/progress-store";
import { todayInIST } from "@/lib/dates";
import {
  CHECK_PASS_PERCENT,
  afterCheck,
  checkPercent,
  isProjectUrl,
  markDone,
  passesCheck,
  statusOf,
} from "@/lib/roadmap/progress";
import type { StopProgress } from "@/lib/roadmap/types";
import { splitStem } from "@/lib/text";

export type CheckQuestionView = {
  id: string;
  stem: string;
  options: { id: string; text: string }[];
  correct: string;
  explanation: string;
};

type Check = { type: "mcq"; questions: CheckQuestionView[] } | { type: "project"; brief: string };

const STATUS_TEXT = { not_started: "Not started", in_progress: "In progress", done: "Done" } as const;
const HOW_TEXT = { check: "passed the check", project: "project submitted", self_skipped: "you said you already know this" } as const;

/** RM-7 and RM-8: status, the check or project, and "I already know this". Saved on this device. */
export function StopProgressPanel({ stopId, check }: { stopId: string; check: Check }) {
  const progress = useProgress();
  const today = useToday();
  const record = progress.stops[stopId] as StopProgress | undefined;
  const status = statusOf(progress.stops, stopId);
  const day = () => today ?? todayInIST();

  return (
    <div className="mt-3 flex flex-col gap-4">
      <p aria-live="polite">
        <span className={muted}>Your status: </span>
        <span className="font-medium">{STATUS_TEXT[status]}</span>
        {record?.how && <span className={muted}> ({HOW_TEXT[record.how]})</span>}
        {record?.score !== undefined && record.how !== "check" && <span className={muted}>. Best check score {record.score}%</span>}
      </p>

      {check.type === "mcq" ? (
        <McqCheck stopId={stopId} questions={check.questions} />
      ) : (
        <ProjectCheck stopId={stopId} brief={check.brief} savedUrl={record?.projectUrl} />
      )}

      <div className="flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        {status === "done" ? (
          <button type="button" className={secondaryButton} onClick={() => clearStop(stopId)}>
            Mark as not done
          </button>
        ) : (
          <>
            {status === "not_started" && (
              <button type="button" className={secondaryButton} onClick={() => setStop(stopId, { status: "in_progress", updatedOn: day() })}>
                I am working on this
              </button>
            )}
            <button type="button" className={secondaryButton} onClick={() => setStop(stopId, markDone("self_skipped", day()))}>
              I already know this
            </button>
            <p className={`text-sm ${muted}`}>
              Skipping marks the step as done. A later test can show it again if you miss its questions.
            </p>
          </>
        )}
        <Link href="/roadmap/genai-engineer" className={`mt-2 ${textLink}`}>
          See the whole roadmap
        </Link>
      </div>
    </div>
  );
}

function McqCheck({ stopId, questions }: { stopId: string; questions: CheckQuestionView[] }) {
  const progress = useProgress();
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [result, setResult] = useState<number | null>(null);
  const complete = questions.every((q) => chosen[q.id]);

  function submit() {
    const correct = questions.filter((q) => chosen[q.id] === q.correct).length;
    const percent = checkPercent(correct, questions.length);
    setResult(percent);
    setStop(stopId, afterCheck(progress.stops[stopId] as StopProgress | undefined, percent, todayInIST()));
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <p className="leading-7">
        {questions.length} quick questions. Get {CHECK_PASS_PERCENT}% or more to finish this step.
      </p>
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
            You scored {result}%.{" "}
            {passesCheck(result) ? "Step done. Well done." : `You need ${CHECK_PASS_PERCENT}% to finish. Review the answers and try again.`}
          </p>
          <button
            type="button"
            className={secondaryButton}
            onClick={() => {
              setChosen({});
              setResult(null);
            }}
          >
            Try the check again
          </button>
        </div>
      )}
    </form>
  );
}

function ProjectCheck({ stopId, brief, savedUrl }: { stopId: string; brief: string; savedUrl?: string }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-3"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!isProjectUrl(url)) {
          setError("Paste a full web link, starting with https://");
          return;
        }
        setError(null);
        setStop(stopId, markDone("project", todayInIST(), url.trim()));
        setUrl("");
      }}
    >
      <p className="leading-7">
        <span className="font-medium">Project:</span> {brief}
      </p>
      {savedUrl && (
        <p className="text-sm break-all">
          Your project:{" "}
          <a href={savedUrl} className={textLink} rel="noopener noreferrer nofollow" target="_blank">
            {savedUrl}
          </a>
        </p>
      )}
      <label htmlFor={`project-${stopId}`} className="font-medium">
        {savedUrl ? "Change the link to your project" : "Link to your project (GitHub, a shared doc or a demo)"}
      </label>
      <input
        id={`project-${stopId}`}
        type="url"
        inputMode="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `project-${stopId}-error` : undefined}
        placeholder="https://"
        className="min-h-12 rounded-lg border border-zinc-400 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
      />
      {error && (
        <p id={`project-${stopId}-error`} className="text-sm text-red-800 dark:text-red-400">
          {error}
        </p>
      )}
      <button type="submit" className={primaryButton}>
        Submit my project
      </button>
    </form>
  );
}
