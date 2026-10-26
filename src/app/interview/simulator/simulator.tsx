"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { card, muted, primaryButton, secondaryButton, textLink } from "@/components/ui";
import { recordInterview } from "@/lib/browser/activity-store";
import { XP } from "@/lib/game/xp";
import { todayInIST } from "@/lib/dates";
import { interviewTopicLabel } from "@/lib/interview-topics";
import {
  type AnswerResult,
  PACE,
  type SimQuestion,
  analyseAnswer,
  pickQuestions,
  sessionReport,
} from "@/lib/interview/analyse";

// ---- browser speech recognition (Chrome, Edge, Safari; not Firefox) ---------

type RecognitionResultList = ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
type RecognitionEvent = { resultIndex: number; results: RecognitionResultList };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

const recognitionCtor = (): RecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

const noop = () => () => {};
const useSpeechSupported = () => useSyncExternalStore(noop, () => recognitionCtor() !== null, () => false);
const useSearch = () => useSyncExternalStore(noop, () => window.location.search, () => "");

// ---- helpers --------------------------------------------------------------

const THINKING_SECONDS = 30;
const COUNTS = [3, 5, 10] as const;

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, "0")}`;
const minutes = (s: number) => (s % 60 === 0 ? `${s / 60} min` : `${Math.floor(s / 60)}.5 min`);
const joinText = (a: string, b: string) => (a && b ? `${a.replace(/\s+$/, "")} ${b.trim()}` : a || b.trim());

type Stage = { kind: "setup" } | { kind: "question"; index: number } | { kind: "report" };
type Answer = { text: string; seconds: number };

// ---- component ------------------------------------------------------------

/**
 * A timed mock interview. The learner answers each question out loud (Space turns
 * the microphone on and off) or by typing; at the end they get a report on the key
 * points covered and on delivery. Everything stays in this browser tab.
 */
export function Simulator({ questions, paths }: { questions: SimQuestion[]; paths: { id: string; name: string }[] }) {
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const fixedQuestion = questions.find((q) => q.id === params.get("question")) ?? null;
  const urlPath = paths.some((p) => p.id === params.get("path")) ? params.get("path") : null;
  const speechSupported = useSpeechSupported();

  const [pathChoice, setPathChoice] = useState<string | null>(null);
  const pathId = pathChoice ?? urlPath ?? "";
  const [count, setCount] = useState<number>(5);
  const [voice, setVoice] = useState(true);
  const [stage, setStage] = useState<Stage>({ kind: "setup" });
  const [session, setSession] = useState<SimQuestion[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const start = (useVoice: boolean) => {
    const picked = fixedQuestion
      ? [fixedQuestion]
      : pickQuestions(questions, { pathId: pathId || null, count, seed: Math.floor(Math.random() * 2 ** 31) });
    setVoice(useVoice && speechSupported);
    setSession(picked);
    setAnswers([]);
    setStage({ kind: "question", index: 0 });
  };

  const submit = (answer: Answer) => {
    if (stage.kind !== "question") return;
    const next = [...answers, answer];
    setAnswers(next);
    setStage(stage.index + 1 < session.length ? { kind: "question", index: stage.index + 1 } : { kind: "report" });
    window.scrollTo({ top: 0 });
  };

  if (stage.kind === "question") {
    const q = session[stage.index];
    return (
      <QuestionScreen
        key={q.id}
        q={q}
        position={stage.index + 1}
        total={session.length}
        voice={voice}
        onVoiceFailed={() => setVoice(false)}
        onSubmit={submit}
      />
    );
  }

  if (stage.kind === "report") {
    return (
      <Report
        questions={session}
        answers={answers}
        onRetry={() => setStage({ kind: "setup" })}
      />
    );
  }

  const available = pathId ? questions.filter((q) => q.paths.includes(pathId)).length : questions.length;
  return (
    <div className="flex flex-col gap-6">
      {fixedQuestion ? (
        <p className={`${card} leading-7`}>
          <span className="font-medium">One question:</span> {fixedQuestion.question}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Role</span>
            <select
              value={pathId}
              onChange={(e) => setPathChoice(e.target.value)}
              className="min-h-12 rounded-lg border border-zinc-400 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
            >
              <option value="">Any AI role</option>
              {paths.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="flex flex-col gap-1">
            <legend className="text-sm font-medium">Questions</legend>
            <div className="flex gap-2">
              {COUNTS.map((n) => (
                <label
                  key={n}
                  className="flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-400 has-[:checked]:border-emerald-700 has-[:checked]:bg-emerald-50 dark:border-zinc-600 dark:has-[:checked]:bg-emerald-950"
                >
                  <input
                    type="radio"
                    name="count"
                    value={n}
                    checked={count === n}
                    onChange={() => setCount(n)}
                    className="accent-emerald-700"
                  />
                  {n}
                </label>
              ))}
            </div>
            <span className={`text-xs ${muted}`}>{available} questions to draw from</span>
          </fieldset>
        </div>
      )}

      <section aria-labelledby="how-heading" className={`${card} leading-7`}>
        <h2 id="how-heading" className="font-semibold">
          How it works
        </h2>
        <ul className="mt-2 list-disc pl-6 [&_li]:mt-1">
          <li>Each question has a time limit of 1 to 2 minutes, as in a real interview.</li>
          <li>
            Press <kbd className="rounded border border-zinc-400 px-1">Space</kbd> or the microphone button to start and
            stop speaking. Your words appear as text, which you can edit.
          </li>
          <li>
            Press <kbd className="rounded border border-zinc-400 px-1">Enter</kbd> to submit. At the end you get a report on
            the key points you covered, your pace, filler words and what to fix first.
          </li>
        </ul>
        <p className={`mt-3 text-sm ${muted}`}>
          Privacy: we never record or store your voice or answers on our servers. Speech-to-text is done by your
          browser&apos;s speech service; in Chrome and Edge that sends audio to the browser maker (Google or Microsoft)
          to turn it into text. Prefer not to? Type your answers instead.
        </p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        {speechSupported ? (
          <>
            <button type="button" onClick={() => start(true)} className={primaryButton}>
              Allow the microphone and start
            </button>
            <button type="button" onClick={() => start(false)} className={secondaryButton}>
              Type my answers instead
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => start(false)} className={primaryButton}>
              Start, typing my answers
            </button>
            <p className={`text-sm ${muted}`}>
              This browser has no speech-to-text. Chrome, Edge or Safari can turn speech into text.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ---- one question ---------------------------------------------------------

function QuestionScreen({
  q,
  position,
  total,
  voice,
  onVoiceFailed,
  onSubmit,
}: {
  q: SimQuestion;
  position: number;
  total: number;
  voice: boolean;
  onVoiceFailed: () => void;
  onSubmit: (a: Answer) => void;
}) {
  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(0);
  const [shownAt] = useState(() => Date.now());
  const [notice, setNotice] = useState<string | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const wantListening = useRef(false);
  const submitted = useRef(false);
  const micButton = useRef<HTMLButtonElement>(null);

  const elapsed = startedAt === null ? 0 : Math.max(0, (now - startedAt) / 1000);
  const left = Math.max(0, q.answer_seconds - elapsed);
  const thinkingLeft = Math.max(0, THINKING_SECONDS - (now - shownAt) / 1000);

  const stopListening = useCallback(() => {
    wantListening.current = false;
    recognition.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  const finish = useCallback(
    (override?: string) => {
      if (submitted.current) return;
      submitted.current = true;
      stopListening();
      const seconds = startedAt === null ? 0 : Math.min(q.answer_seconds, (Date.now() - startedAt) / 1000);
      onSubmit({ text: (override ?? joinText(text, interim)).trim(), seconds });
    },
    [onSubmit, q.answer_seconds, startedAt, stopListening, text, interim],
  );

  const beginClock = useCallback(() => setStartedAt((s) => s ?? Date.now()), []);

  const startListening = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    beginClock();
    recognition.current?.abort();
    const r = new Ctor();
    r.lang = "en-IN";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interimText += res[0].transcript;
      }
      if (finalText) setText((t) => joinText(t, finalText));
      setInterim(interimText);
    };
    r.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      wantListening.current = false;
      setListening(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setNotice("The microphone is blocked, so type your answer. You can allow it in the browser's site settings.");
        onVoiceFailed();
      } else {
        setNotice("Speech-to-text stopped working. Type the rest of your answer, or press the microphone again.");
      }
    };
    // Browsers end recognition after a pause; carry on while the learner still wants it.
    r.onend = () => {
      if (recognition.current !== r) return; // a replaced recogniser ends quietly
      if (wantListening.current) {
        try {
          r.start();
        } catch {
          setListening(false);
        }
      } else setListening(false);
    };
    recognition.current = r;
    wantListening.current = true;
    try {
      r.start();
      setListening(true);
      setNotice(null);
    } catch {
      // Already started: nothing to do.
    }
  }, [beginClock, onVoiceFailed]);

  const toggleMic = useCallback(() => {
    if (wantListening.current) stopListening();
    else startListening();
  }, [startListening, stopListening]);

  // The clock ticks four times a second. It starts when the learner starts, or after the thinking time.
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      setStartedAt((s) => s ?? (t - shownAt >= THINKING_SECONDS * 1000 ? t : null));
    }, 250);
    return () => window.clearInterval(id);
  }, [shownAt]);
  const timeUp = startedAt !== null && left <= 0;
  useEffect(() => {
    if (timeUp) finish();
  }, [timeUp, finish]);

  // Space toggles the microphone anywhere except while typing; Enter submits.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el?.tagName === "TEXTAREA" || el?.tagName === "INPUT" || el?.tagName === "SELECT";
      if (e.key === " " && voice && !typing && el?.tagName !== "BUTTON" && el?.tagName !== "A") {
        e.preventDefault();
        toggleMic();
      } else if (e.key === "Enter" && !e.shiftKey && (el?.tagName === "TEXTAREA" || el === document.body)) {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [voice, toggleMic, finish]);

  useEffect(() => {
    micButton.current?.focus();
    return () => {
      wantListening.current = false;
      recognition.current?.abort();
    };
  }, []);

  const lowTime = startedAt !== null && left <= 15;

  return (
    <div className="flex flex-col gap-5">
      <p className={`text-sm ${muted}`}>
        Question {position} of {total} · {interviewTopicLabel(q.topic)} · {q.level} · {minutes(q.answer_seconds)} to answer
      </p>
      <h2 className="text-2xl leading-9 font-semibold text-balance">{q.question}</h2>

      <div className="flex items-center gap-3" aria-live="off">
        <span
          className={`font-mono text-3xl tabular-nums ${lowTime ? "text-red-700 dark:text-red-400" : ""}`}
          aria-hidden="true"
        >
          {clock(startedAt === null ? q.answer_seconds : left)}
        </span>
        <span className={`text-sm ${muted}`}>
          {startedAt === null
            ? `Think first. The clock starts when you start, or in ${Math.ceil(thinkingLeft)} s.`
            : listening
              ? "Listening…"
              : "Time left"}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800" aria-hidden="true">
        <div
          className={`h-full ${lowTime ? "bg-red-600" : "bg-emerald-600"}`}
          style={{ width: `${startedAt === null ? 100 : (left / q.answer_seconds) * 100}%` }}
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {startedAt !== null && Math.ceil(left) === 30 ? "30 seconds left" : ""}
        {startedAt !== null && Math.ceil(left) === 10 ? "10 seconds left" : ""}
      </p>

      {voice && (
        <button
          ref={micButton}
          type="button"
          onClick={toggleMic}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              finish();
            }
          }}
          aria-pressed={listening}
          className={`${listening ? "bg-red-700 text-white hover:bg-red-800" : "bg-emerald-700 text-white hover:bg-emerald-800"} inline-flex min-h-14 items-center justify-center gap-3 rounded-full px-6 py-3 text-lg font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700`}
        >
          <span
            aria-hidden="true"
            className={`inline-block size-3 rounded-full ${listening ? "animate-pulse bg-white" : "bg-white/70"}`}
          />
          {listening ? "Stop the microphone" : text ? "Speak more" : "Start speaking"}
          <span className="text-sm font-normal opacity-80">(Space)</span>
        </button>
      )}

      {notice && (
        <p role="alert" className="rounded-lg bg-amber-50 p-3 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {notice}
        </p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Your answer{voice ? " (you can edit it)" : ""}</span>
        <textarea
          value={listening ? joinText(text, interim) : text}
          readOnly={listening}
          onChange={(e) => {
            beginClock();
            setText(e.target.value);
          }}
          rows={7}
          placeholder={voice ? "Press Space and start talking…" : "Type your answer as you would say it…"}
          className="rounded-lg border border-zinc-400 bg-white p-3 leading-7 dark:border-zinc-600 dark:bg-zinc-950"
        />
        <span className={`text-xs ${muted}`}>Enter submits; Shift and Enter starts a new line.</span>
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={() => finish()} className={primaryButton}>
          Submit answer (Enter)
        </button>
        <button
          type="button"
          onClick={() => finish("")}
          className={secondaryButton}
        >
          Skip this question
        </button>
      </div>
    </div>
  );
}

// ---- the report -----------------------------------------------------------

const LENGTH_NOTE: Record<AnswerResult["delivery"]["length"], string> = {
  empty: "No answer",
  short: "Ended early",
  good: "Good length",
  "ran-out": "Ran out of time",
};

function Report({ questions, answers, onRetry }: { questions: SimQuestion[]; answers: Answer[]; onRetry: () => void }) {
  const results = useMemo(
    () => questions.map((q, i) => analyseAnswer(q, answers[i]?.text ?? "", answers[i]?.seconds ?? 0)),
    [questions, answers],
  );
  const report = useMemo(() => sessionReport(questions, results), [questions, results]);
  const heading = useRef<HTMLHeadingElement>(null);
  const recorded = useRef(false);
  useEffect(() => heading.current?.focus(), []);
  // Count the session for XP and streaks: dates and scores only, never the answers.
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    recordInterview({ on: todayInIST(), answered: report.answered, total: questions.length, averageScore: report.averageScore });
  }, [report, questions.length]);

  const paceNote =
    report.pace === null
      ? "Not enough speech to judge"
      : report.pace > PACE.fast
        ? `${report.pace} words a minute: a little fast`
        : report.pace < PACE.slow
          ? `${report.pace} words a minute: a little slow`
          : `${report.pace} words a minute: comfortable`;

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="report-heading" className="flex flex-col gap-3">
        <h2 id="report-heading" ref={heading} tabIndex={-1} className="text-2xl font-semibold">
          Your interview report
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Score", `${report.averageScore} / 5`],
            ["Key points", `${report.coveredPoints} of ${report.totalPoints}`],
            ["Answered", `${report.answered} of ${questions.length}`],
            ["Fillers", `${report.fillersPerMinute} a minute`],
          ].map(([k, v]) => (
            <div key={k} className={card}>
              <dt className={`text-sm ${muted}`}>{k}</dt>
              <dd className="mt-1 text-xl font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="leading-7">
          <span className="font-medium">Pace:</span> {paceNote}.
        </p>
        <p className="w-fit rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          +{report.answered * XP.interviewAnswer + Math.round(report.averageScore * questions.length * XP.interviewScorePoint)} XP earned
        </p>
        <p className={`text-sm ${muted}`}>
          The score counts the key points your answer mentioned, by matching words. It cannot tell whether your
          explanation was right, so read the model answers too. Filler counts depend on the speech service, which often
          leaves out “um” and “uh”.
        </p>
      </section>

      {report.fixes.length > 0 && (
        <section aria-labelledby="fix-heading">
          <h3 id="fix-heading" className="text-xl font-semibold">
            Fix these first
          </h3>
          <ol className="mt-3 list-decimal pl-6 leading-7 [&_li]:mt-2">
            {report.fixes.map((f) => (
              <li key={f.text}>{f.text}</li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="each-heading" className="flex flex-col gap-4">
        <h3 id="each-heading" className="text-xl font-semibold">
          Question by question
        </h3>
        {questions.map((q, i) => {
          const r = results[i];
          return (
            <article key={q.id} className={card}>
              <h4 className="font-semibold leading-7">
                {i + 1}. {q.question}
              </h4>
              <p className={`mt-1 text-sm ${muted}`}>
                {r.score} / 5 · {LENGTH_NOTE[r.delivery.length]} · {Math.round(r.delivery.secondsUsed)} s of{" "}
                {q.answer_seconds} s · {r.delivery.words} words
                {r.delivery.wordsPerMinute !== null ? ` · ${r.delivery.wordsPerMinute} words a minute` : ""}
                {r.delivery.fillers.total > 0
                  ? ` · fillers: ${r.delivery.fillers.top.map((f) => `“${f.word}” ${f.count}`).join(", ")}`
                  : ""}
              </p>
              <h5 className="mt-3 text-sm font-medium">Key points</h5>
              <ul className="mt-1 flex flex-col gap-1 leading-7">
                {r.points.map((p) => (
                  <li key={p.point} className="flex gap-2">
                    <span aria-hidden="true" className={p.covered ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}>
                      {p.covered ? "✓" : "✗"}
                    </span>
                    <span>
                      <span className="sr-only">{p.covered ? "Covered: " : "Missed: "}</span>
                      {p.point}
                    </span>
                  </li>
                ))}
              </ul>
              <details className="mt-3">
                <summary className="min-h-8 cursor-pointer font-medium">Your answer and a model answer</summary>
                <p className="mt-2 text-sm font-medium">You said</p>
                <p className="mt-1 leading-7 whitespace-pre-wrap">{answers[i]?.text || "No answer."}</p>
                <p className="mt-3 text-sm font-medium">A strong short answer</p>
                <p className="mt-1 rounded-lg bg-zinc-100 p-3 leading-7 dark:bg-zinc-900">{q.short_answer}</p>
              </details>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <Link href={`/interview/${q.id}`} className={textLink}>
                  Full answer and follow-ups
                </Link>
                <Link href={`/stop/${q.stop.id}`} className={textLink}>
                  Lesson: {q.stop.title}
                </Link>
              </p>
            </article>
          );
        })}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row print:hidden">
        <button type="button" onClick={onRetry} className={primaryButton}>
          New interview
        </button>
        <button type="button" onClick={() => window.print()} className={secondaryButton}>
          Print or save as PDF
        </button>
      </div>
      <p className={`text-sm ${muted}`}>This report is not saved. Print it or save it as a PDF to keep it.</p>
    </div>
  );
}
