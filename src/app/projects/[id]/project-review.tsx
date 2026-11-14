"use client";

import { useId, useState } from "react";
import { aiPost } from "@/components/ai/ai-client";
import { AiGate, useAiAccess } from "@/components/ai/ai-gate";
import { primaryButton } from "@/components/ui";
import type { ProjectReview } from "@/lib/ai/features";

const LEVEL = {
  strong: { label: "Strong", tone: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200" },
  ok: { label: "Partly there", tone: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" },
  weak: { label: "Not yet", tone: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200" },
} as const;

const field =
  "min-h-11 w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700";

/**
 * PR-1: "Get your project reviewed". The learner gives a public GitHub link (optional) and what they
 * built; the AI scores it against this project's rubric, criterion by criterion. A pass (70 or more,
 * nothing weak) counts towards the certificate.
 */
export function ProjectReviewPanel({ projectId, enabled }: { projectId: string; enabled: boolean }) {
  const access = useAiAccess(enabled);
  const [repoUrl, setRepoUrl] = useState("");
  const [writeup, setWriteup] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ review: ProjectReview; readRepo: boolean } | null>(null);
  const repoId = useId();
  const writeId = useId();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await aiPost<{ review: ProjectReview; readRepo: boolean }>("/api/ai/project", { projectId, repoUrl: repoUrl.trim(), writeup });
    setBusy(false);
    if (res.ok) setResult(res.data);
    else setError(res.message);
  };

  return (
    <section id="review" aria-labelledby="review-h" className="mt-8 scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-5 md:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 id="review-h" className="text-xl font-semibold">
        Get your project reviewed
      </h2>
      <p className="mt-1 leading-7 text-zinc-700 dark:text-zinc-300">
        Share what you built and get a score against this project&apos;s rubric, criterion by criterion, with what to fix next. A pass counts towards your certificate.
      </p>
      <AiGate access={access} next={`/projects/${projectId}#review`} kind="grade" label="answer and project reviews">
        {result ? (
          <div aria-live="polite" className="mt-4 flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="text-4xl font-semibold tabular-nums">{result.review.score}</p>
              <p className="font-medium">{result.review.passed ? "Passed: this counts towards your certificate" : "Not passed yet: fix the points below and review again"}</p>
            </div>
            <p className="leading-7">{result.review.summary}</p>
            {!result.readRepo && repoUrl.trim() && <p className="text-sm text-zinc-600 dark:text-zinc-400">We could not read a README from that link, so the review is based on your write-up.</p>}
            <ul className="flex flex-col gap-3">
              {result.review.criteria.map((c) => (
                <li key={c.criterion} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${LEVEL[c.level].tone}`}>{LEVEL[c.level].label}</span>
                    <span className="font-medium">{c.criterion}</span>
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{c.evidence}</p>
                  {c.fix && <p className="mt-1 text-sm leading-6">{c.fix}</p>}
                </li>
              ))}
            </ul>
            {result.review.next_steps.length > 0 && (
              <div>
                <p className="font-medium">Do this next</p>
                <ul className="mt-1 list-disc pl-5 leading-7">
                  {result.review.next_steps.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
            <button type="button" className="self-start text-sm font-medium text-violet-800 underline underline-offset-4 dark:text-violet-300" onClick={() => setResult(null)}>
              Review an updated version
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
            <label htmlFor={repoId} className="flex flex-col gap-1">
              <span className="text-sm font-medium">Public GitHub link (optional)</span>
              <input id={repoId} type="url" inputMode="url" placeholder="https://github.com/you/your-project" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} maxLength={300} className={field} />
            </label>
            <label htmlFor={writeId} className="flex flex-col gap-1">
              <span className="text-sm font-medium">What you built</span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">How it works, the choices you made, how you tested it and what you would do next. A few short paragraphs.</span>
              <textarea id={writeId} required minLength={150} maxLength={4000} rows={7} value={writeup} onChange={(e) => setWriteup(e.target.value)} className={field} />
            </label>
            <button type="submit" disabled={busy || writeup.trim().length < 150} className={`${primaryButton} self-start disabled:opacity-50`}>
              {busy ? "Reviewing your project…" : "Review my project"}
            </button>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Your write-up and the README are sent to Claude, Anthropic&apos;s AI model, for this review and are not stored. We keep the score.
            </p>
            {error && (
              <p role="alert" className="text-sm text-rose-800 dark:text-rose-300">
                {error}
              </p>
            )}
          </form>
        )}
      </AiGate>
    </section>
  );
}
