"use client";

import { useState } from "react";
import { Icon } from "@/components/art/icons";
import type { GradeResult } from "@/lib/ai/features";
import { aiPost } from "./ai-client";
import { AiGate, useAiAccess } from "./ai-gate";

/** IQ-7: an AI grade for one typed or spoken answer, on request. Hidden when AI is off. */
export function AiGrade({ enabled, questionId, answer }: { enabled: boolean; questionId: string; answer: string }) {
  const access = useAiAccess(enabled);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (access === "off" || !answer.trim()) return null;

  const run = async () => {
    setBusy(true);
    setError(null);
    const res = await aiPost<{ grade: GradeResult }>("/api/ai/grade", { questionId, answer });
    setBusy(false);
    if (res.ok) setGrade(res.data.grade);
    else setError(res.message);
  };

  return (
    <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900 dark:bg-violet-950/20">
      {grade ? (
        <div aria-live="polite">
          <p className="flex items-center gap-2 font-semibold">
            <Icon name="sparkles" size={16} /> AI feedback: {grade.score} / 5
          </p>
          <p className="mt-1">{grade.verdict}</p>
          <p className="mt-2 leading-7">{grade.feedback}</p>
          {grade.missing.length > 0 && <p className="mt-2 text-sm">Missing: {grade.missing.join("; ")}</p>}
          <p className="mt-3 text-sm font-medium">A stronger version of your answer</p>
          <p className="mt-1 rounded-lg bg-white p-3 leading-7 dark:bg-zinc-900">{grade.stronger_answer}</p>
        </div>
      ) : (
        <AiGate access={access} next="/interview/simulator">
          <button type="button" onClick={() => void run()} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-violet-700 px-4 font-medium text-white hover:bg-violet-800 disabled:opacity-60">
            <Icon name="sparkles" size={16} /> {busy ? "Grading…" : "Get AI feedback on this answer"}
          </button>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">Your answer is sent to Claude, Anthropic&apos;s AI model, to grade it against the key points. 5 grades a day.</p>
          {error && (
            <p role="alert" className="mt-2 text-sm text-rose-800 dark:text-rose-300">
              {error}
            </p>
          )}
        </AiGate>
      )}
    </div>
  );
}
