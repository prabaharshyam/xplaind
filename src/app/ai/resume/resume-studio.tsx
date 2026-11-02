"use client";

import { useId, useState } from "react";
import { aiPost } from "@/components/ai/ai-client";
import { AiGate, useAiAccess } from "@/components/ai/ai-gate";
import { AiError, AiWorking } from "@/components/ai/ai-working";
import { Icon } from "@/components/art/icons";
import { primaryButton, secondaryButton } from "@/components/ui";
import type { ResumeReview } from "@/lib/ai/features";

const field = "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950";
const TONE = {
  high: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
  medium: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  low: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
} as const;

/** RV-1 to RV-3: read a resume in the browser, send its text for one review, show the fixes in order. */
export function ResumeStudio({ enabled, roles }: { enabled: boolean; roles: string[] }) {
  const access = useAiAccess(enabled);
  const fileId = useId();
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [role, setRole] = useState("");
  const [job, setJob] = useState("");
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<ResumeReview | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setReading(true);
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("That file is over 5 MB. A resume PDF is usually much smaller.");
      const { readBookFile } = await import("@/lib/book/read-file");
      const read = await readBookFile(file);
      const all = read.pages.map((p) => p.text).join("\n\n").trim();
      if (all.length < 200) throw new Error("We could not read enough text from that file. If it is a scanned image, export your resume from Word or Google Docs as a PDF, or paste the text.");
      setText(all.slice(0, 15_000));
      setFileName(file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That file could not be opened.");
    } finally {
      setReading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 200) return setError("Add your resume first: upload a PDF or paste the text.");
    setBusy(true);
    setError(null);
    const res = await aiPost<{ review: ResumeReview }>("/api/ai/resume", { resume: text, role, job });
    setBusy(false);
    if (!res.ok) return setError(res.message);
    setReview(res.data.review);
    requestAnimationFrame(() => document.getElementById("resume-review")?.focus());
  };

  if (review) return <Review review={review} onAgain={() => setReview(null)} />;

  return (
    <AiGate access={access} next="/ai/resume">
      {busy ? (
        <AiWorking steps={["Reading your resume", "Checking it like a recruiter", "Checking it like an ATS", "Writing your fixes"]} />
      ) : (
        <form onSubmit={submit} className="space-y-6">
          <div className="rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/50 p-5 dark:border-violet-800 dark:bg-violet-950/20">
            <label htmlFor={fileId} className="block font-semibold">
              Upload your resume
            </label>
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">A PDF with selectable text, or a .txt file. Using Word? Save it as PDF first.</p>
            <input
              id={fileId}
              type="file"
              accept=".pdf,application/pdf,.txt,text/plain"
              onChange={(e) => void pick(e.target.files?.[0])}
              className="mt-3 block w-full text-sm file:mr-3 file:min-h-11 file:rounded-full file:border-0 file:bg-violet-700 file:px-4 file:font-medium file:text-white"
            />
            {reading && <p className="mt-2 text-sm">Reading your file…</p>}
            {fileName && !reading && (
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                <Icon name="tick" size={16} /> Read {fileName}: {text.length.toLocaleString("en-IN")} characters
              </p>
            )}
          </div>

          <label className="block">
            <span className="font-semibold">Or paste the text</span>
            <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 15_000))} rows={8} className={`${field} mt-2 font-mono text-sm`} placeholder="Paste your resume here" />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="font-semibold">Role you are applying for</span>
              <input list="resume-roles" value={role} onChange={(e) => setRole(e.target.value)} maxLength={80} className={`${field} mt-2 min-h-11`} placeholder="For example: AI Engineer" />
              <datalist id="resume-roles">
                {roles.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </label>
            <label className="block md:row-span-2">
              <span className="font-semibold">Job post (optional)</span>
              <textarea value={job} onChange={(e) => setJob(e.target.value.slice(0, 6_000))} rows={4} className={`${field} mt-2 text-sm`} placeholder="Paste the job description for a sharper match" />
            </label>
          </div>

          {error && <AiError message={error} />}
          <button type="submit" className={primaryButton} disabled={reading}>
            <Icon name="sparkles" size={18} /> Review my resume
          </button>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Your file is read in your browser. Only its text is sent to the AI, for this one review, and Xplaind does not store it. You may remove your phone number and
            address before reviewing.
          </p>
        </form>
      )}
    </AiGate>
  );
}

function Review({ review, onAgain }: { review: ResumeReview; onAgain: () => void }) {
  const tone = review.score >= 75 ? "text-emerald-700 dark:text-emerald-400" : review.score >= 50 ? "text-amber-700 dark:text-amber-400" : "text-rose-700 dark:text-rose-400";
  return (
    <section id="resume-review" tabIndex={-1} aria-labelledby="review-heading" className="space-y-6 outline-none">
      <div className="flex flex-wrap items-center gap-6 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-center">
          <p className={`text-5xl font-semibold tabular-nums ${tone}`}>{review.score}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">out of 100</p>
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="review-heading" className="text-xl font-semibold">
            Shortlist readiness
          </h2>
          <p className="mt-1 leading-7">{review.verdict}</p>
        </div>
      </div>

      {review.strengths.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold">What already works</h3>
          <ul className="mt-2 space-y-2">
            {review.strengths.map((s) => (
              <li key={s} className="flex gap-2">
                <Icon name="tick" size={18} className="mt-1 shrink-0 text-emerald-600" /> <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold">Fix these, most important first</h3>
        <ol className="mt-3 space-y-3">
          {review.fixes.map((f, i) => (
            <li key={i} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="flex flex-wrap items-center gap-2 text-sm">
                <span className={`rounded-full px-2 py-0.5 font-semibold capitalize ${TONE[f.priority]}`}>{f.priority}</span>
                <span className="font-medium text-zinc-600 dark:text-zinc-400">{f.area}</span>
              </p>
              <p className="mt-2 font-medium">{f.issue}</p>
              <p className="mt-1 leading-7 text-zinc-700 dark:text-zinc-300">{f.suggestion}</p>
              {f.example && (
                <p className="mt-2 rounded-xl bg-zinc-100 p-3 text-sm leading-6 dark:bg-zinc-800">
                  <span className="font-semibold">Try: </span>
                  {f.example}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>

      {review.missing_keywords.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold">Keywords recruiters will look for</h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Add the ones you genuinely have. Applicant tracking systems match on these words.</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {review.missing_keywords.map((k) => (
              <li key={k} className="rounded-full bg-violet-50 px-3 py-1 text-sm ring-1 ring-violet-200 dark:bg-violet-950/40 dark:ring-violet-900">
                {k}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onAgain} className={secondaryButton}>
          Review another version
        </button>
        <button type="button" onClick={() => window.print()} className={secondaryButton}>
          Print or save as PDF
        </button>
      </div>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">Made by Claude, an AI model from Anthropic. It can be wrong, so use your judgement.</p>
    </section>
  );
}
