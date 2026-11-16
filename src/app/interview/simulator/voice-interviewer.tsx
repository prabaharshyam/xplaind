"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { card, muted, primaryButton, secondaryButton, textLink } from "@/components/ui";
import {
  MIC_BLOCKED,
  joinText,
  speak,
  stopSpeaking,
  useDictation,
  useSpeechOutSupported,
  useSpeechSupported,
} from "@/components/interview/speech";
import { readinessLabel, type Readiness } from "@/lib/interview/readiness";
import type { SimQuestion } from "@/lib/interview/analyse";
import type { Exchange, VoiceReport } from "@/lib/ai/voice-interview";

/**
 * VI-1 to VI-5: the AI voice interviewer (Pro). It reads each question aloud, the learner answers by voice
 * (speech-to-text in this browser) or by typing, and it asks 1 or 2 follow-ups based on what they said.
 * Then one call scores the whole interview. Audio never leaves the browser; only the text is sent (VI-2).
 */

type Item = { questionId: string; exchanges: Exchange[] };
type Turn = { index: number; asked: string; followUp: number };
type Failure = { message: string; upgrade?: string; signin?: boolean };
type Phase =
  | { kind: "consent" }
  | { kind: "checking" }
  | { kind: "stopped"; failure: Failure }
  | { kind: "answer"; turn: Turn }
  | { kind: "thinking"; turn: Turn }
  | { kind: "scoring" }
  | { kind: "report"; report: VoiceReport; readiness: Readiness | null }
  | { kind: "report-failed"; failure: Failure };

const failureFrom = async (res: Response): Promise<Failure> => {
  const data = (await res.json().catch(() => ({}))) as { error?: string; upgrade?: string; signin?: boolean };
  return { message: data.error ?? "Something went wrong. Please try again.", upgrade: data.upgrade, signin: data.signin };
};

const MAX_SECONDS = 900;

export function VoiceInterviewer({ questions, pathId, onExit }: { questions: SimQuestion[]; pathId: string | null; onExit: () => void }) {
  const speechIn = useSpeechSupported();
  const speechOut = useSpeechOutSupported();
  const [phase, setPhase] = useState<Phase>({ kind: "consent" });
  const [items, setItems] = useState<Item[]>([]);
  const [typing, setTyping] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const [readAloud, setReadAloud] = useState(true);
  const [status, setStatus] = useState("");

  // VI-5: if the browser already blocks the microphone for this site, say so before the interview starts.
  useEffect(() => {
    const perms = (navigator as Navigator & { permissions?: { query: (d: { name: string }) => Promise<{ state: string }> } }).permissions;
    perms
      ?.query({ name: "microphone" })
      .then((p) => {
        if (p.state === "denied") {
          setMicDenied(true);
          setTyping(true);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => () => stopSpeaking(), []);

  const score = useCallback(
    async (all: Item[]) => {
      stopSpeaking();
      setPhase({ kind: "scoring" });
      setStatus("Scoring your interview. This takes up to a minute.");
      try {
        const res = await fetch("/api/ai/voice/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...(pathId ? { pathId } : {}), items: all.filter((i) => i.exchanges.length > 0) }),
        });
        if (!res.ok) return setPhase({ kind: "report-failed", failure: await failureFrom(res) });
        const data = (await res.json()) as { report: VoiceReport; readiness: Readiness | null };
        setPhase({ kind: "report", report: data.report, readiness: data.readiness });
        setStatus("Your interview report is ready.");
      } catch {
        setPhase({ kind: "report-failed", failure: { message: "We could not reach the interviewer. Check your connection and try again." } });
      }
    },
    [pathId],
  );

  const ask = useCallback(
    (turn: Turn) => {
      setPhase({ kind: "answer", turn });
      setStatus(turn.followUp ? `Follow-up question: ${turn.asked}` : `Question ${turn.index + 1} of ${questions.length}: ${turn.asked}`);
    },
    [questions.length],
  );

  const nextQuestion = useCallback(
    (index: number, all: Item[]) => {
      if (index + 1 < questions.length) ask({ index: index + 1, asked: questions[index + 1].question, followUp: 0 });
      else if (all.some((i) => i.exchanges.some((e) => e.answer.trim()))) void score(all);
      else setPhase({ kind: "report-failed", failure: { message: "You skipped every question, so there is nothing to score. Start again when you are ready." } });
    },
    [ask, questions, score],
  );

  const begin = async () => {
    setPhase({ kind: "checking" });
    try {
      const res = await fetch("/api/ai/voice");
      if (!res.ok) return setPhase({ kind: "stopped", failure: await failureFrom(res) });
    } catch {
      return setPhase({ kind: "stopped", failure: { message: "We could not reach the interviewer. Check your connection and try again." } });
    }
    const fresh = questions.map((q) => ({ questionId: q.id, exchanges: [] as Exchange[] }));
    setItems(fresh);
    ask({ index: 0, asked: questions[0].question, followUp: 0 });
  };

  const submit = async (turn: Turn, answer: string, seconds: number) => {
    stopSpeaking();
    const all = items.map((it, i) => (i === turn.index ? { ...it, exchanges: [...it.exchanges, { asked: turn.asked, answer, seconds }] } : it));
    setItems(all);
    if (!answer.trim()) return nextQuestion(turn.index, all);
    setPhase({ kind: "thinking", turn });
    setStatus("The interviewer is thinking of a follow-up.");
    try {
      const res = await fetch("/api/ai/voice/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: all[turn.index].questionId, exchanges: all[turn.index].exchanges }),
      });
      if (!res.ok) return setPhase({ kind: "stopped", failure: await failureFrom(res) });
      const { follow_up } = (await res.json()) as { follow_up: string | null };
      if (follow_up) ask({ index: turn.index, asked: follow_up, followUp: turn.followUp + 1 });
      else nextQuestion(turn.index, all);
    } catch {
      setStatus("We could not reach the interviewer, so we moved on to the next question.");
      nextQuestion(turn.index, all);
    }
  };

  const answeredSoFar = items.some((i) => i.exchanges.some((e) => e.answer.trim()));

  return (
    <div className="flex flex-col gap-6">
      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      {phase.kind === "consent" && (
        <section aria-labelledby="consent-heading" className={`${card} flex flex-col gap-4 leading-7`}>
          <h2 id="consent-heading" className="text-2xl font-semibold">
            Before you start
          </h2>
          <ul className="list-disc pl-6 [&_li]:mt-1">
            <li>
              {questions.length} questions for your role. After each answer the interviewer asks 1 or 2 follow-up questions
              about what you said, like a real interviewer. Then you get a scored report.
            </li>
            <li>Speak your answers, or type them. The interviewer does not coach you during the interview.</li>
          </ul>
          <div className="rounded-2xl bg-brand-50 p-4 dark:bg-brand-950" role="note" aria-labelledby="privacy-note">
            <p id="privacy-note" className="font-semibold">
              What is sent to our AI
            </p>
            <p className="mt-1">
              Your browser turns your speech into text. Only that text (the transcript) is sent to our AI, Anthropic&apos;s
              Claude, to ask follow-ups and score you. Your voice is never uploaded to Xplaind or stored. We keep only your
              score, not what you said.
            </p>
            <p className={`mt-2 text-sm ${muted}`}>
              In Chrome and Edge, speech-to-text sends your audio to the browser maker (Google or Microsoft) to turn it into
              text. Prefer not to? Type your answers instead.
            </p>
          </div>
          {micDenied && (
            <p role="alert" className="rounded-2xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              {MIC_BLOCKED}
            </p>
          )}
          {!speechIn && !micDenied && <p className={`text-sm ${muted}`}>This browser has no speech-to-text, so you will type your answers. Chrome, Edge or Safari can listen.</p>}
          {speechOut && (
            <label className="flex min-h-11 items-center gap-3">
              <input type="checkbox" checked={readAloud} onChange={(e) => setReadAloud(e.target.checked)} className="size-5 accent-brand-700" />
              Read the questions aloud
            </label>
          )}
          {speechIn && !micDenied && (
            <label className="flex min-h-11 items-center gap-3">
              <input type="checkbox" checked={typing} onChange={(e) => setTyping(e.target.checked)} className="size-5 accent-brand-700" />
              I will type my answers instead of speaking
            </label>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => void begin()} className={primaryButton}>
              I agree, start the interview
            </button>
            <button type="button" onClick={onExit} className={secondaryButton}>
              Go back
            </button>
          </div>
        </section>
      )}

      {phase.kind === "checking" && <p className={muted}>Getting the interviewer ready…</p>}

      {phase.kind === "stopped" && <Stopped failure={phase.failure} onExit={onExit} onReport={answeredSoFar ? () => void score(items) : undefined} />}

      {(phase.kind === "answer" || phase.kind === "thinking") && (
        <AnswerTurn
          key={`${phase.turn.index}-${phase.turn.followUp}`}
          turn={phase.turn}
          total={questions.length}
          busy={phase.kind === "thinking"}
          voice={speechIn && !typing}
          readAloud={readAloud && speechOut}
          onMicBlocked={() => setTyping(true)}
          onSubmit={(answer, seconds) => void submit(phase.turn, answer, seconds)}
          onEnd={answeredSoFar ? () => void score(items) : onExit}
          endLabel={answeredSoFar ? "End and get my report" : "End the interview"}
        />
      )}

      {phase.kind === "scoring" && (
        <div className={`${card} flex items-center gap-3`} role="status">
          <span aria-hidden="true" className="inline-block size-3 rounded-full bg-brand-700 motion-safe:animate-pulse" />
          Scoring your interview. This takes up to a minute.
        </div>
      )}

      {phase.kind === "report-failed" && (
        <div className="flex flex-col gap-3">
          <p role="alert" className="rounded-2xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            {phase.failure.message} {phase.failure.upgrade && <Link href={phase.failure.upgrade} className={textLink}>See Pro</Link>}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {answeredSoFar && !phase.failure.upgrade && (
              <button type="button" onClick={() => void score(items)} className={primaryButton}>
                Try the report again
              </button>
            )}
            <button type="button" onClick={onExit} className={secondaryButton}>
              Back to the mock interview
            </button>
          </div>
        </div>
      )}

      {phase.kind === "report" && <VoiceReportView report={phase.report} readiness={phase.readiness} onExit={onExit} />}
    </div>
  );
}

function Stopped({ failure, onExit, onReport }: { failure: Failure; onExit: () => void; onReport?: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <p role="alert" className="rounded-2xl bg-amber-50 p-3 leading-7 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
        {failure.message}{" "}
        {failure.upgrade && (
          <Link href={failure.upgrade} className={textLink}>
            See Pro
          </Link>
        )}
        {failure.signin && (
          <Link href="/signin?next=/interview/simulator" className={textLink}>
            Sign in
          </Link>
        )}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {onReport && (
          <button type="button" onClick={onReport} className={primaryButton}>
            Get my report so far
          </button>
        )}
        <button type="button" onClick={onExit} className={secondaryButton}>
          Back to the mock interview
        </button>
      </div>
    </div>
  );
}

// ---- one question or follow-up --------------------------------------------

function AnswerTurn({
  turn,
  total,
  busy,
  voice,
  readAloud,
  onMicBlocked,
  onSubmit,
  onEnd,
  endLabel,
}: {
  turn: Turn;
  total: number;
  busy: boolean;
  voice: boolean;
  readAloud: boolean;
  onMicBlocked: () => void;
  onSubmit: (answer: string, seconds: number) => void;
  onEnd: () => void;
  endLabel: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const begin = useCallback(() => setStartedAt((s) => s ?? Date.now()), []);
  const onStart = useCallback(() => {
    stopSpeaking(); // never let the microphone hear the question being read
    begin();
  }, [begin]);
  const { text, setText, interim, listening, notice, toggle, abort } = useDictation({ onStart, onBlocked: onMicBlocked });

  useEffect(() => {
    heading.current?.focus();
    if (readAloud) speak(turn.asked);
    return () => stopSpeaking();
  }, [readAloud, turn.asked]);

  const send = (skip = false) => {
    if (busy) return;
    abort();
    const seconds = startedAt === null ? 0 : Math.min(MAX_SECONDS, Math.round((Date.now() - startedAt) / 1000));
    onSubmit(skip ? "" : joinText(text, interim).trim(), seconds);
  };

  return (
    <section aria-labelledby="turn-heading" className="flex flex-col gap-5">
      <p className={`text-sm ${muted}`}>
        Question {turn.index + 1} of {total}
        {turn.followUp > 0 && ` · Follow-up ${turn.followUp} of up to 2`}
      </p>
      <h2 id="turn-heading" ref={heading} tabIndex={-1} className="text-2xl leading-9 font-semibold text-balance">
        {turn.asked}
      </h2>
      {readAloud && (
        <button type="button" onClick={() => speak(turn.asked)} className={`${secondaryButton} self-start`}>
          Read it again
        </button>
      )}

      {voice && (
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          aria-pressed={listening}
          className={`${listening ? "bg-rose-700 hover:bg-rose-800" : "bg-brand-700 hover:bg-brand-800"} inline-flex min-h-14 items-center justify-center gap-3 rounded-full px-6 py-3 text-lg font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:opacity-60`}
        >
          <span aria-hidden="true" className={`inline-block size-3 rounded-full bg-white ${listening ? "motion-safe:animate-pulse" : ""}`} />
          {listening ? "Stop the microphone" : text ? "Speak more" : "Start speaking"}
        </button>
      )}

      {notice && (
        <p role="alert" className="rounded-2xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {notice}
        </p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Your answer{voice ? " (you can edit it)" : ""}</span>
        <textarea
          value={listening ? joinText(text, interim) : text}
          readOnly={listening || busy}
          onChange={(e) => {
            begin();
            setText(e.target.value);
          }}
          rows={6}
          placeholder={voice ? "Press “Start speaking” and answer out loud…" : "Type your answer as you would say it…"}
          className="rounded-2xl border border-zinc-400 bg-white p-3 leading-7 dark:border-zinc-600 dark:bg-zinc-950"
        />
      </label>

      {busy ? (
        <p className={`${card} flex items-center gap-3`} role="status">
          <span aria-hidden="true" className="inline-block size-3 rounded-full bg-brand-700 motion-safe:animate-pulse" />
          The interviewer is thinking of a follow-up…
        </p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button type="button" onClick={() => send()} className={primaryButton}>
            Submit answer
          </button>
          <button type="button" onClick={() => send(true)} className={secondaryButton}>
            {turn.followUp ? "Skip this follow-up" : "Skip this question"}
          </button>
          <button type="button" onClick={onEnd} className={secondaryButton}>
            {endLabel}
          </button>
        </div>
      )}
    </section>
  );
}

// ---- the report ------------------------------------------------------------

const outOf5 = (n: number) => `${n} / 5`;

function VoiceReportView({ report, readiness, onExit }: { report: VoiceReport; readiness: Readiness | null; onExit: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const c = report.communication;
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="voice-report-heading" className="flex flex-col gap-4">
        <h2 id="voice-report-heading" ref={heading} tabIndex={-1} className="text-2xl font-semibold">
          Your AI interview report
        </h2>
        <div className="rounded-2xl bg-zinc-100 p-4 md:p-5 dark:bg-zinc-900">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold">Interview score</p>
            <p className="text-3xl font-semibold">{report.score} / 100</p>
          </div>
          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
            role="meter"
            aria-label="Interview score"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={report.score}
          >
            <div className="h-full bg-brand-700" style={{ width: `${report.score}%` }} />
          </div>
          {report.summary && <p className="mt-3 leading-7">{report.summary}</p>}
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Answered", `${report.answered} of ${report.questions.length}`],
              ["Communication", `${c.score} / 100`],
              ["Structure", outOf5(c.structure)],
              ["Clarity", outOf5(c.clarity)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white p-3 dark:bg-zinc-950">
                <dt className={`text-sm ${muted}`}>{k}</dt>
                <dd className="mt-1 text-xl font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm leading-6">
            <span className="font-medium">Filler words:</span> {c.fillers.total} ({c.fillers.perMinute} a minute)
            {c.fillers.top.length > 0 && `: ${c.fillers.top.map((f) => `“${f.word}” ${f.count}`).join(", ")}`}
            {c.wordsPerMinute !== null && ` · ${c.words} words, ${c.wordsPerMinute} a minute`}
          </p>
          {c.note && <p className="mt-1 text-sm leading-6">{c.note}</p>}
        </div>
        {readiness && (
          <p className={`${card} leading-7`}>
            <span className="font-semibold">Readiness for this role: {readiness.score} / 100</span> ({readinessLabel(readiness.score)}), from your last{" "}
            {Math.min(3, readiness.sessions)} reviewed interviews
            {readiness.change !== null && `, ${readiness.change >= 0 ? "up" : "down"} ${Math.abs(readiness.change)} on the three before`}.
          </p>
        )}
        <p className={`text-sm ${muted}`}>
          The score is 60% the key points you covered, 20% the depth of your answers and 20% communication. Filler words
          are counted from the transcript; speech services often leave out “um” and “uh”.
        </p>
      </section>

      {report.improvements.length > 0 && (
        <section aria-labelledby="improve-heading">
          <h3 id="improve-heading" className="text-xl font-semibold">
            Three things to improve
          </h3>
          <ol className="mt-3 list-decimal pl-6 leading-7 [&_li]:mt-2">
            {report.improvements.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="voice-each-heading" className="flex flex-col gap-4">
        <h3 id="voice-each-heading" className="text-xl font-semibold">
          Question by question
        </h3>
        {report.questions.map((q, i) => (
          <article key={q.questionId} className={card}>
            <h4 className="font-semibold leading-7">
              {i + 1}. {q.question}
            </h4>
            <p className={`mt-1 text-sm ${muted}`}>
              {q.answered ? `${q.coverage}% of key points · depth ${outOf5(q.depth)} · ${q.followUps} follow-up${q.followUps === 1 ? "" : "s"}` : "Not answered"}
            </p>
            {q.depthNote && <p className="mt-2 text-sm leading-6">{q.depthNote}</p>}
            <h5 className="mt-3 text-sm font-semibold">Key points</h5>
            <ul className="mt-1 flex flex-col gap-2 text-sm leading-6">
              {q.points.map((p) => (
                <li key={p.point}>
                  <span aria-hidden="true" className={p.covered ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}>
                    {p.covered ? "✓ " : "✗ "}
                  </span>
                  <span className="sr-only">{p.covered ? "Covered: " : "Missed: "}</span>
                  {p.point}
                  {p.evidence && <span className={`block ${muted}`}>You said: “{p.evidence}”</span>}
                </li>
              ))}
            </ul>
            <details className="mt-3">
              <summary className="min-h-11 cursor-pointer font-medium">A model answer</summary>
              <p className="mt-2 rounded-2xl bg-zinc-100 p-3 leading-7 dark:bg-zinc-900">{q.modelAnswer}</p>
            </details>
            <p className="mt-2 text-sm">
              <Link href={`/interview/${q.questionId}`} className={textLink}>
                Full answer and follow-ups
              </Link>
            </p>
          </article>
        ))}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row print:hidden">
        <button type="button" onClick={onExit} className={primaryButton}>
          New interview
        </button>
        <button type="button" onClick={() => window.print()} className={secondaryButton}>
          Print or save as PDF
        </button>
      </div>
      <p className={`text-sm ${muted}`}>
        We saved only your score{readiness ? " for your readiness" : ""}, not what you said. Print this report or save it as a PDF to keep it.
      </p>
    </div>
  );
}
