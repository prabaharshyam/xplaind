"use client";

import { useState } from "react";
import { Icon } from "@/components/art/icons";
import type { AnswerReview, InterviewReview } from "@/lib/ai/features";
import { aiPost } from "./ai-client";
import { type AiAccess, AiGate } from "./ai-gate";

export type ReviewState = { review: InterviewReview | null; busy: boolean; error: string | null; run: () => void };

/** IQ-7 for a whole mock interview: one call reviews every answered question. */
export function useInterviewReview(answers: { questionId: string; answer: string }[]): ReviewState {
  const [review, setReview] = useState<InterviewReview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = () => {
    const sent = answers.filter((a) => a.answer.trim());
    if (sent.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    void aiPost<{ review: InterviewReview }>("/api/ai/interview", { answers: sent.slice(0, 10) }).then((res) => {
      setBusy(false);
      if (res.ok) setReview(res.data.review);
      else setError(res.message);
    });
  };
  return { review, busy, error, run };
}

const UNDERSTANDING_LABEL: Record<AnswerReview["understanding"], string> = {
  strong: "Strong understanding",
  good: "Good, with gaps",
  partial: "Partial understanding",
  weak: "Needs work",
};

/** The session-level AI analysis, or the button that asks for it. */
export function InterviewReviewPanel({ access, state, answered }: { access: AiAccess; state: ReviewState; answered: number }) {
  if (access === "off" || answered === 0) return null;
  const { review, busy, error, run } = state;
  return (
    <section aria-labelledby="ai-review-h" className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 md:p-5 dark:border-violet-900 dark:bg-violet-950/20">
      <h3 id="ai-review-h" className="flex items-center gap-2 text-xl font-semibold">
        <Icon name="sparkles" size={18} /> AI analysis of your answers
      </h3>
      {review ? (
        <div aria-live="polite" className="mt-2 flex flex-col gap-3">
          <p className="leading-7">{review.summary}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["What you do well", review.strengths, "text-emerald-800 dark:text-emerald-300"],
                ["Concepts to work on", review.gaps, "text-rose-800 dark:text-rose-300"],
                ["Do this next", review.next_steps, "text-violet-800 dark:text-violet-300"],
              ] as const
            ).map(([title, items, tone]) =>
              items.length ? (
                <div key={title} className="rounded-xl bg-white p-3 dark:bg-zinc-900">
                  <p className={`text-sm font-semibold ${tone}`}>{title}</p>
                  <ul className="mt-1 list-disc pl-5 text-sm leading-6">
                    {items.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              ) : null,
            )}
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Each question below now also shows what the AI found right, wrong and missing.</p>
        </div>
      ) : (
        <AiGate access={access} next="/interview/simulator">
          <p className="mt-1 leading-7">
            The checks above match words. The AI reads your answers for meaning: what is right, what is wrong or misleading, and how well you understand each concept.
          </p>
          <button
            type="button"
            onClick={run}
            disabled={busy}
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-violet-700 px-4 font-medium text-white hover:bg-violet-800 disabled:opacity-60"
          >
            <Icon name="sparkles" size={16} /> {busy ? "Analysing your answers…" : `Analyse all ${answered} answers with AI`}
          </button>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            Your answers are sent to Claude, Anthropic&apos;s AI model, to grade them against the reference answers. 3 reviews a day.
          </p>
          {error && (
            <p role="alert" className="mt-2 text-sm text-rose-800 dark:text-rose-300">
              {error}
            </p>
          )}
        </AiGate>
      )}
    </section>
  );
}

/** The AI's review of one answer, inside that question's card. */
export function AnswerReviewBlock({ r }: { r: AnswerReview }) {
  return (
    <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900 dark:bg-violet-950/20">
      <p className="flex flex-wrap items-center gap-2 font-semibold">
        <Icon name="sparkles" size={16} /> AI: {r.score} / 5 · {UNDERSTANDING_LABEL[r.understanding]}
      </p>
      <p className="mt-1">{r.verdict}</p>
      {r.correct.length > 0 && (
        <>
          <p className="mt-3 text-sm font-semibold text-emerald-800 dark:text-emerald-300">What you got right</p>
          <ul className="mt-1 list-disc pl-5 text-sm leading-6">
            {r.correct.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </>
      )}
      {r.mistakes.length > 0 && (
        <>
          <p className="mt-3 text-sm font-semibold text-rose-800 dark:text-rose-300">Wrong or misleading, with the correction</p>
          <ul className="mt-1 list-disc pl-5 text-sm leading-6">
            {r.mistakes.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </>
      )}
      {r.missing.length > 0 && <p className="mt-3 text-sm">Missing: {r.missing.join("; ")}</p>}
      <p className="mt-3 leading-7">{r.feedback}</p>
      <p className="mt-3 text-sm font-medium">A stronger version of your answer</p>
      <p className="mt-1 rounded-lg bg-white p-3 leading-7 dark:bg-zinc-900">{r.stronger_answer}</p>
    </div>
  );
}
