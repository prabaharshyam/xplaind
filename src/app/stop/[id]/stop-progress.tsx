"use client";

import Link from "next/link";
import { useState } from "react";
import { Celebrate } from "@/components/celebrate";
import { McqQuiz, type McqQuestion } from "@/components/mcq-quiz";
import { XP } from "@/lib/game/xp";
import { muted, primaryButton, secondaryButton, textLink } from "@/components/ui";
import { useProgress, useToday } from "@/lib/browser/hooks";
import { clearStop, setStop } from "@/lib/browser/progress-store";
import { todayInIST } from "@/lib/dates";
import {
  CHECK_PASS_PERCENT,
  afterCheck,
  isProjectUrl,
  markDone,
  passesCheck,
  statusOf,
} from "@/lib/roadmap/progress";
import type { StopProgress } from "@/lib/roadmap/types";

export type CheckQuestionView = McqQuestion;

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
  const [party, setParty] = useState<{ xp: number; message: string } | null>(null);
  const celebrate = (xp: number, message: string) => {
    if (status !== "done") setParty({ xp, message });
  };

  return (
    <div className="mt-3 flex flex-col gap-4">
      {party && <Celebrate xp={party.xp} message={party.message} onDone={() => setParty(null)} />}
      <p aria-live="polite">
        <span className={muted}>Your status: </span>
        <span className="font-medium">{STATUS_TEXT[status]}</span>
        {record?.how && <span className={muted}> ({HOW_TEXT[record.how]})</span>}
        {record?.score !== undefined && record.how !== "check" && <span className={muted}>. Best check score {record.score}%</span>}
      </p>

      {check.type === "mcq" ? (
        <McqCheck
          stopId={stopId}
          questions={check.questions}
          onPassed={(p) => celebrate(XP.lessonCheck + (p === 100 ? XP.perfectCheck : 0), p === 100 ? "Perfect score. Lesson done!" : "Lesson done!")}
        />
      ) : (
        <ProjectCheck stopId={stopId} brief={check.brief} savedUrl={record?.projectUrl} onDone={() => celebrate(XP.lessonProject, "Your project is in. Lesson done!")} />
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
            <button
              type="button"
              className={secondaryButton}
              onClick={() => {
                celebrate(XP.lessonSkipped, "Marked as known.");
                setStop(stopId, markDone("self_skipped", day()));
              }}
            >
              I already know this
            </button>
            <p className={`text-sm ${muted}`}>
              Skipping marks the step as done. A later test can show it again if you miss its questions.
            </p>
          </>
        )}
        <Link href="/paths" className={`mt-2 ${textLink}`}>
          See all paths
        </Link>
      </div>
    </div>
  );
}

function McqCheck({ stopId, questions, onPassed }: { stopId: string; questions: CheckQuestionView[]; onPassed: (percent: number) => void }) {
  const progress = useProgress();
  return (
    <McqQuiz
      questions={questions}
      intro={`${questions.length} quick questions. Get ${CHECK_PASS_PERCENT}% or more to finish this step.`}
      verdict={(p) => (passesCheck(p) ? "Step done. Well done." : `You need ${CHECK_PASS_PERCENT}% to finish. Review the answers and try again.`)}
      retryLabel="Try the check again"
      onScored={(p) => {
        if (passesCheck(p)) onPassed(p);
        setStop(stopId, afterCheck(progress.stops[stopId] as StopProgress | undefined, p, todayInIST()));
      }}
    />
  );
}

function ProjectCheck({ stopId, brief, savedUrl, onDone }: { stopId: string; brief: string; savedUrl?: string; onDone: () => void }) {
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
        onDone();
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
