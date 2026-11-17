"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { card, muted, primaryButton, secondaryButton, textLink } from "@/components/ui";
import { MIC_BLOCKED, joinText, speak, stopSpeaking, useDictation, useSpeechSupported } from "@/components/interview/speech";
import { readinessLabel, type Readiness } from "@/lib/interview/readiness";
import type { SimQuestion } from "@/lib/interview/analyse";
import type { Exchange, VoiceReport } from "@/lib/ai/voice-interview";

/**
 * VI-1 to VI-7: the AI voice interviewer (Pro), as a hands-free conversation. One tap starts it. The
 * interviewer speaks in a natural voice (VI-6), the microphone opens by itself, and a pause of about
 * 2.5 seconds sends the answer (VI-7). It reacts briefly, asks 1 or 2 follow-ups about what was said,
 * moves on, and ends with a scored report. Speech-to-text runs in this browser; only text is sent (VI-2).
 */

type Item = { questionId: string; exchanges: Exchange[] };
type Turn = { index: number; asked: string; followUp: number };
type Failure = { message: string; upgrade?: string; signin?: boolean };
type Line = { who: "ai" | "me"; text: string };
type Phase =
  | { kind: "consent" }
  | { kind: "starting" }
  | { kind: "talk"; turn: Turn; state: "speaking" | "listening" | "thinking" | "paused" }
  | { kind: "stopped"; failure: Failure }
  | { kind: "scoring" }
  | { kind: "report"; report: VoiceReport; readiness: Readiness | null }
  | { kind: "report-failed"; failure: Failure };

/** VI-7: how long a pause ends an answer. Long enough to think mid-sentence, short enough to feel natural. */
export const SILENCE_MS = 2500;
const MAX_SECONDS = 900;
/** A tiny silent WAV, played inside the Start tap so phones allow the interviewer's voice afterwards. */
const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

const failureFrom = async (res: Response): Promise<Failure> => {
  const data = (await res.json().catch(() => ({}))) as { error?: string; upgrade?: string; signin?: boolean };
  return { message: data.error ?? "Something went wrong. Please try again.", upgrade: data.upgrade, signin: data.signin };
};

/** A spoken line: audio from our voice service, or the text for the browser to read when there is none. */
type Clip = { text: string; url: string | null };

const b64ToUrl = (b64: string) => {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
};

async function fetchLine(body: Record<string, unknown>): Promise<Clip | Failure> {
  const res = await fetch("/api/ai/voice/speak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok && res.status !== 204) return failureFrom(res);
  const text = decodeURIComponent(res.headers.get("x-say") ?? "");
  if (res.status === 204) return { text, url: null };
  return { text, url: URL.createObjectURL(await res.blob()) };
}
const isFailure = (x: Clip | Failure): x is Failure => "message" in x;

export function VoiceInterviewer({ questions, pathId, onExit }: { questions: SimQuestion[]; pathId: string | null; onExit: () => void }) {
  const speechIn = useSpeechSupported();
  const [phase, setPhase] = useState<Phase>({ kind: "consent" });
  const [items, setItems] = useState<Item[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [typing, setTyping] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const [status, setStatus] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null);
  const clips = useRef(new Map<number, Promise<Clip | Failure>>());
  const lastLine = useRef<Clip | null>(null);
  const live = useRef(true);

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
    return () => {
      live.current = false;
      audio.current?.pause();
      stopSpeaking();
    };
  }, []);

  /** Plays one line in the interviewer's voice, or the browser's voice as a fallback. Resolves when it ends. */
  const say = useCallback((clip: Clip) => {
    lastLine.current = clip;
    return new Promise<void>((done) => {
      const el = audio.current;
      if (clip.url && el) {
        el.onended = () => done();
        el.onerror = () => (speak(clip.text, done) ? undefined : done());
        el.src = clip.url;
        el.play().catch(() => (speak(clip.text, done) ? undefined : done()));
      } else if (!speak(clip.text, done)) done();
    });
  }, []);

  const quiet = () => {
    audio.current?.pause();
    stopSpeaking();
  };

  const questionClip = useCallback(
    (index: number) => {
      if (!clips.current.has(index))
        clips.current.set(index, fetchLine({ line: "question", questionId: questions[index].id, index, total: questions.length }));
      return clips.current.get(index)!;
    },
    [questions],
  );

  const score = useCallback(
    async (all: Item[]) => {
      setPhase({ kind: "scoring" });
      setStatus("Scoring your interview. This takes up to a minute.");
      void fetchLine({ line: "closing" }).then((c) => (!isFailure(c) && live.current ? say(c) : undefined));
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
    [pathId, say],
  );

  /** The interviewer says a line, then the learner's turn begins. */
  const speakThenListen = useCallback(
    async (turn: Turn, clip: Clip) => {
      setLines((l) => [...l, { who: "ai", text: clip.text }]);
      setPhase({ kind: "talk", turn, state: "speaking" });
      setStatus(`Interviewer: ${clip.text}`);
      await say(clip);
      if (!live.current) return;
      setPhase((p) => (p.kind === "talk" && p.state === "speaking" ? { ...p, state: "listening" } : p));
    },
    [say],
  );

  const askQuestion = useCallback(
    async (index: number) => {
      const clip = await questionClip(index);
      if (index + 1 < questions.length) void questionClip(index + 1); // ready before it is needed
      if (isFailure(clip)) return setPhase({ kind: "stopped", failure: clip });
      await speakThenListen({ index, asked: questions[index].question, followUp: 0 }, clip);
    },
    [questionClip, questions, speakThenListen],
  );

  const nextQuestion = useCallback(
    (index: number, all: Item[]) => {
      if (index + 1 < questions.length) void askQuestion(index + 1);
      else if (all.some((i) => i.exchanges.some((e) => e.answer.trim()))) void score(all);
      else setPhase({ kind: "report-failed", failure: { message: "You skipped every question, so there is nothing to score. Start again when you are ready." } });
    },
    [askQuestion, questions.length, score],
  );

  const begin = async () => {
    // Inside the tap: unlock audio for the rest of the interview (phones block sound that no tap started).
    const el = new Audio();
    el.setAttribute("playsinline", "");
    el.src = SILENT_WAV;
    void el.play().catch(() => undefined);
    audio.current = el;
    setPhase({ kind: "starting" });
    setStatus("Getting the interviewer ready.");
    try {
      const res = await fetch("/api/ai/voice");
      if (!res.ok) return setPhase({ kind: "stopped", failure: await failureFrom(res) });
    } catch {
      return setPhase({ kind: "stopped", failure: { message: "We could not reach the interviewer. Check your connection and try again." } });
    }
    setItems(questions.map((q) => ({ questionId: q.id, exchanges: [] })));
    setLines([]);
    void askQuestion(0);
  };

  const answer = async (turn: Turn, text: string, seconds: number) => {
    const all = items.map((it, i) => (i === turn.index ? { ...it, exchanges: [...it.exchanges, { asked: turn.asked, answer: text, seconds }] } : it));
    setItems(all);
    if (text.trim()) setLines((l) => [...l, { who: "me", text }]);
    if (!text.trim()) return nextQuestion(turn.index, all);
    setPhase({ kind: "talk", turn, state: "thinking" });
    setStatus("The interviewer is thinking.");
    try {
      const res = await fetch("/api/ai/voice/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: all[turn.index].questionId, exchanges: all[turn.index].exchanges }),
      });
      if (!res.ok) return setPhase({ kind: "stopped", failure: await failureFrom(res) });
      const data = (await res.json()) as { follow_up: string | null; say?: string; audio?: string | null };
      if (!live.current) return;
      if (data.follow_up) {
        const clip = { text: data.say ?? data.follow_up, url: data.audio ? b64ToUrl(data.audio) : null };
        await speakThenListen({ index: turn.index, asked: data.follow_up, followUp: turn.followUp + 1 }, clip);
      } else nextQuestion(turn.index, all);
    } catch {
      setStatus("We could not reach the interviewer, so we moved on to the next question.");
      nextQuestion(turn.index, all);
    }
  };

  const pause = (turn: Turn) => {
    quiet();
    setPhase({ kind: "talk", turn, state: "paused" });
    setStatus("Paused.");
  };
  const resume = (turn: Turn) => {
    // Say the last line again, as an interviewer would after a pause, then listen.
    const clip = lastLine.current;
    if (!clip) return setPhase({ kind: "talk", turn, state: "listening" });
    setPhase({ kind: "talk", turn, state: "speaking" });
    void say(clip).then(() => live.current && setPhase((p) => (p.kind === "talk" && p.state === "speaking" ? { ...p, state: "listening" } : p)));
  };

  const answeredSoFar = items.some((i) => i.exchanges.some((e) => e.answer.trim()));
  const end = () => {
    quiet();
    if (answeredSoFar) void score(items);
    else onExit();
  };

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
              A spoken interview of {questions.length} {questions.length === 1 ? "question" : "questions"}. The interviewer asks,
              you answer out loud, and it asks 1 or 2 follow-ups about what you said, like a real interviewer.
            </li>
            <li>It is hands-free: when you stop talking for a moment, your answer is sent. You can pause, type instead or end at any time.</li>
            <li>Find a quiet place and use headphones if you can.</li>
          </ul>
          <div className="rounded-2xl bg-brand-50 p-4 dark:bg-brand-950" role="note" aria-labelledby="privacy-note">
            <p id="privacy-note" className="font-semibold">
              What is sent to our AI
            </p>
            <p className="mt-1">
              Your browser turns your speech into text. Only that text (the transcript) is sent to our AI, Anthropic&apos;s
              Claude, to ask follow-ups and score you. Your voice is never uploaded to Xplaind or stored. The interviewer&apos;s
              voice is made by Sarvam AI from the interviewer&apos;s lines, which can quote what you said. We keep only your
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

      {phase.kind === "starting" && (
        <Stage state="thinking" label="Getting the interviewer ready…" />
      )}

      {phase.kind === "stopped" && <Stopped failure={phase.failure} onExit={onExit} onReport={answeredSoFar ? () => void score(items) : undefined} />}

      {phase.kind === "talk" && (
        <section aria-labelledby="talk-heading" className="flex flex-col gap-4">
          <h2 id="talk-heading" className="sr-only">
            Interview in progress
          </h2>
          <p className={`text-center text-sm ${muted}`}>
            Question {phase.turn.index + 1} of {questions.length}
            {phase.turn.followUp > 0 && ` · follow-up ${phase.turn.followUp}`}
          </p>
          <Listener
            key={`${phase.turn.index}-${phase.turn.followUp}`}
            state={phase.state}
            voice={speechIn && !typing}
            onMicBlocked={() => setTyping(true)}
            onTypeInstead={() => setTyping(true)}
            onAnswer={(text, seconds) => void answer(phase.turn, text, seconds)}
            onPause={() => pause(phase.turn)}
            onResume={() => resume(phase.turn)}
            onEnd={end}
            endLabel={answeredSoFar ? "End and get my report" : "End the interview"}
          />
          <Conversation lines={lines} />
        </section>
      )}

      {phase.kind === "scoring" && (
        <>
          <Stage state="thinking" label="Scoring your interview. This takes up to a minute." />
          <Conversation lines={lines} />
        </>
      )}

      {phase.kind === "report-failed" && (
        <div className="flex flex-col gap-3">
          <p role="alert" className="rounded-2xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            {phase.failure.message}{" "}
            {phase.failure.upgrade && (
              <Link href={phase.failure.upgrade} className={textLink}>
                See Pro
              </Link>
            )}
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

// ---- the stage: one circle that shows who is talking ------------------------

type StageState = "speaking" | "listening" | "thinking" | "paused";

const STAGE_LABEL: Record<StageState, string> = {
  speaking: "Interviewer is speaking",
  listening: "Listening… pause for a moment when you are done",
  thinking: "Thinking…",
  paused: "Paused",
};

/** VI-7: a large circle in the centre, like a voice call. It moves only when motion is allowed (VI-5). */
function Stage({ state, label }: { state: StageState; label?: string }) {
  const ring =
    state === "speaking"
      ? "bg-brand-700 motion-safe:animate-pulse"
      : state === "listening"
        ? "bg-emerald-600"
        : state === "thinking"
          ? "bg-brand-500"
          : "bg-zinc-400 dark:bg-zinc-600";
  return (
    <div className="flex flex-col items-center gap-3 py-2" role="status">
      <div className="relative grid size-36 place-items-center" aria-hidden="true">
        {state === "listening" && <span className="absolute inset-0 rounded-full bg-emerald-500/30 motion-safe:animate-ping" />}
        {state === "thinking" && <span className="absolute inset-0 rounded-full border-4 border-dashed border-brand-400 motion-safe:animate-spin" />}
        <span className={`relative size-28 rounded-full shadow-lg ${ring}`} />
      </div>
      <p className="text-center font-medium">{label ?? STAGE_LABEL[state]}</p>
    </div>
  );
}

// ---- the learner's turn ------------------------------------------------------

/**
 * Listens hands-free while it is the learner's turn: the microphone opens by itself, the words appear as
 * a live caption, and a pause of SILENCE_MS sends them. "Send now", "Type instead", "Pause" and "End"
 * are always one tap away. If the microphone cannot start without a tap (some phones), it asks for one.
 */
function Listener({
  state,
  voice,
  onMicBlocked,
  onTypeInstead,
  onAnswer,
  onPause,
  onResume,
  onEnd,
  endLabel,
}: {
  state: StageState;
  voice: boolean;
  onMicBlocked: () => void;
  onTypeInstead: () => void;
  onAnswer: (text: string, seconds: number) => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  endLabel: string;
}) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const sent = useRef(false);
  const onStart = useCallback(() => setStartedAt((s) => s ?? Date.now()), []);
  const { text, setText, interim, listening, notice, start, abort } = useDictation({ onStart, onBlocked: onMicBlocked });
  const said = joinText(text, interim).trim();

  const send = useCallback(
    (skip = false) => {
      if (sent.current) return;
      sent.current = true;
      abort();
      const seconds = startedAt === null ? 0 : Math.min(MAX_SECONDS, Math.round((Date.now() - startedAt) / 1000));
      onAnswer(skip ? "" : said, seconds);
    },
    [abort, onAnswer, said, startedAt],
  );

  // The microphone opens by itself, once, when it is the learner's turn, and closes otherwise.
  const opened = useRef(false);
  useEffect(() => {
    if (state === "listening" && voice && !sent.current && !opened.current) {
      opened.current = true;
      start();
    }
    if (state !== "listening" && opened.current) {
      opened.current = false;
      abort();
    }
  }, [state, voice, start, abort]);

  // VI-7: a pause ends the answer. Every new word restarts the clock.
  useEffect(() => {
    if (state !== "listening" || !voice || !said || sent.current) return;
    const t = window.setTimeout(() => send(), SILENCE_MS);
    return () => window.clearTimeout(t);
  }, [said, state, voice, send]);

  const myTurn = state === "listening";
  return (
    <div className="flex flex-col gap-4">
      <Stage state={state} />

      {myTurn && voice && (
        <p className="min-h-14 rounded-2xl bg-zinc-100 p-3 text-center leading-7 dark:bg-zinc-900" aria-live="off">
          {said || <span className={muted}>{listening ? "Go ahead, I'm listening." : "Starting the microphone…"}</span>}
        </p>
      )}

      {myTurn && voice && !listening && !said && notice && (
        <button type="button" onClick={start} className={`${primaryButton} self-center`}>
          Tap to answer
        </button>
      )}

      {notice && (
        <p role="alert" className="rounded-2xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {notice}
        </p>
      )}

      {myTurn && !voice && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) send();
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Your answer</span>
            <textarea
              value={text}
              onChange={(e) => {
                onStart();
                setText(e.target.value);
              }}
              rows={5}
              placeholder="Type your answer as you would say it…"
              className="rounded-2xl border border-zinc-400 bg-white p-3 leading-7 dark:border-zinc-600 dark:bg-zinc-950"
            />
          </label>
          <button type="submit" className={primaryButton} disabled={!text.trim()}>
            Send answer
          </button>
        </form>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {myTurn && voice && said && (
          <button type="button" onClick={() => send()} className={secondaryButton}>
            Send now
          </button>
        )}
        {myTurn && voice && (
          <button type="button" onClick={onTypeInstead} className={secondaryButton}>
            Type instead
          </button>
        )}
        {myTurn && (
          <button type="button" onClick={() => send(true)} className={secondaryButton}>
            Skip
          </button>
        )}
        {state === "paused" ? (
          <button type="button" onClick={onResume} className={primaryButton}>
            Resume
          </button>
        ) : (
          state !== "thinking" && (
            <button type="button" onClick={onPause} className={secondaryButton}>
              Pause
            </button>
          )
        )}
        <button type="button" onClick={onEnd} className={secondaryButton}>
          {endLabel}
        </button>
      </div>
    </div>
  );
}

// ---- the conversation so far ---------------------------------------------------

function Conversation({ lines }: { lines: Line[] }) {
  // NV-4: the conversation scrolls inside its own box to the newest line; the page itself never moves.
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [lines.length]);
  if (lines.length === 0) return null;
  return (
    <section aria-labelledby="conversation-heading">
      <h3 id="conversation-heading" className={`text-sm font-medium ${muted}`}>
        Conversation
      </h3>
      <ol
        ref={list}
        tabIndex={0}
        aria-labelledby="conversation-heading"
        className="mt-2 flex max-h-80 flex-col gap-2 overflow-y-auto rounded-2xl p-1 focus-visible:outline-2 focus-visible:outline-brand-700"
      >
        {lines.map((l, i) => (
          <li
            key={i}
            className={`max-w-[85%] rounded-2xl px-4 py-2 leading-7 ${
              l.who === "ai" ? "self-start rounded-bl-sm bg-zinc-100 dark:bg-zinc-900" : "self-end rounded-br-sm bg-brand-700 text-white"
            }`}
          >
            <span className="sr-only">{l.who === "ai" ? "Interviewer: " : "You: "}</span>
            {l.text}
          </li>
        ))}
      </ol>
    </section>
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
