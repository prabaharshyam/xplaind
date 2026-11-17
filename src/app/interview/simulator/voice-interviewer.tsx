"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { card, muted, primaryButton, secondaryButton, textLink } from "@/components/ui";
import { MIC_BLOCKED, joinText, speak, stopSpeaking, useDictation, useSpeechSupported } from "@/components/interview/speech";
import { readinessLabel, type Readiness } from "@/lib/interview/readiness";
import type { SimQuestion } from "@/lib/interview/analyse";
import { isCustomId, type InterviewSetup } from "@/lib/ai/interview-plan";
import { EARLY_SEND_MS, pauseToSend, shouldCheckEnd, type Exchange, type VoiceReport } from "@/lib/ai/voice-interview";
import { type Mic, canRecord, closeMic, openMic, useVoiceCapture } from "@/components/interview/voice-capture";

/**
 * VI-1 to VI-8: the AI voice interviewer (Pro), as a call. One tap starts it. The interviewer speaks in a
 * natural voice streamed as it is made (VI-6, VI-8), the microphone opens by itself, and a pause sends the
 * answer, longer when the learner trails off mid-thought (VI-8). It says a short "Okay" at once, then a
 * follow-up about what was said, moves on, and ends with a scored report. Speech-to-text runs in this
 * browser; only text is sent (VI-2).
 */

type Item = { questionId: string; exchanges: Exchange[] };
/** VI-14: clarify marks a turn where she explained the question; it does not count as a follow-up. */
type Turn = { index: number; asked: string; followUp: number; clarify?: boolean };
type Failure = { message: string; upgrade?: string; signin?: boolean };
/** One spoken line: its words, and a URL for its natural voice (null: the browser reads it). */
type Spoken = { text: string; audio: string | null };
type Line = { who: "ai" | "me"; text: string };
type Lines = { questions: Spoken[]; acks: Spoken[]; closing: Spoken; hear: string | null };
type CallState = "speaking" | "listening" | "thinking" | "paused";
type Phase =
  | { kind: "consent" }
  | { kind: "starting" }
  | { kind: "call"; turn: Turn; state: CallState; line: string }
  | { kind: "stopped"; failure: Failure }
  | { kind: "scoring" }
  | { kind: "report"; report: VoiceReport; readiness: Readiness | null }
  | { kind: "report-failed"; failure: Failure };

const MAX_SECONDS = 900;
/** A tiny silent WAV, played inside the Start tap so phones allow the interviewer's voice afterwards. */
const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
/** How long before an automatic send the learner is shown "Sending" and can say "Hold on". */
const WARN_MS = 1400;

const failureFrom = async (res: Response): Promise<Failure> => {
  const data = (await res.json().catch(() => ({}))) as { error?: string; upgrade?: string; signin?: boolean };
  return { message: data.error ?? "Something went wrong. Please try again.", upgrade: data.upgrade, signin: data.signin };
};
/** Fetches a line's voice early so it plays at once later (the response may be cached by the browser). */
const warm = (s: Spoken | undefined) => {
  if (s?.audio) void fetch(s.audio).then((r) => r.arrayBuffer()).catch(() => undefined);
};
const post = (url: string, body: unknown) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

/** A question as the interviewer needs it: a bank question, or one written for a job description (VI-11). */
export type CallQuestion = Pick<SimQuestion, "id" | "question">;

export function VoiceInterviewer({
  questions,
  pathId,
  setup,
  plan,
  trial = false,
  onExit,
}: {
  questions: CallQuestion[];
  pathId: string | null;
  /** VI-11: the role, experience and company chosen before the interview, sent with every call. */
  setup?: InterviewSetup;
  /** VI-11: the sealed plan made from a job description, sent back with every call. */
  plan?: string | null;
  /** VI-13: this is the learner's one free AI interview; the report then offers Pro. */
  trial?: boolean;
  onExit: () => void;
}) {
  const extra = useMemo(() => ({ ...(setup ? { setup } : {}), ...(plan ? { plan } : {}) }), [setup, plan]);
  const speechIn = useSpeechSupported();
  const [phase, setPhase] = useState<Phase>({ kind: "consent" });
  const [items, setItems] = useState<Item[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [typing, setTyping] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const [status, setStatus] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const script = useRef<Lines | null>(null);
  const last = useRef<Spoken | null>(null);
  const live = useRef(true);
  const ackTurn = useRef(0);
  /** VI-9: the microphone for Sarvam speech-to-text, opened at Start; null means the browser's own recogniser. */
  const [mic, setMic] = useState<Mic | null>(null);
  const [hear, setHear] = useState<string | null>(null);
  const micRef = useRef<Mic | null>(null);

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
      closeMic(micRef.current);
    };
  }, []);

  /** Plays a line in the interviewer's voice, or the browser's voice as a fallback. Resolves when it ends. */
  const say = useCallback((s: Spoken) => {
    last.current = s;
    return new Promise<void>((done) => {
      const el = audio.current;
      const fallback = () => (speak(s.text, done) ? undefined : done());
      if (s.audio && el) {
        el.onended = () => done();
        el.onerror = fallback;
        el.src = s.audio;
        el.play().catch(fallback);
      } else fallback();
    });
  }, []);
  const quiet = () => {
    audio.current?.pause();
    stopSpeaking();
  };

  const score = useCallback(
    async (all: Item[]) => {
      quiet();
      setPhase({ kind: "scoring" });
      setStatus("Scoring your interview. This takes up to a minute.");
      if (script.current) void say(script.current.closing);
      try {
        const res = await post("/api/ai/voice/report", { ...extra, ...(pathId ? { pathId } : {}), items: all.filter((i) => i.exchanges.length > 0) });
        if (!res.ok) return setPhase({ kind: "report-failed", failure: await failureFrom(res) });
        const data = (await res.json()) as { report: VoiceReport; readiness: Readiness | null };
        closeMic(micRef.current);
        micRef.current = null;
        setPhase({ kind: "report", report: data.report, readiness: data.readiness });
        setStatus("Your interview report is ready.");
      } catch {
        setPhase({ kind: "report-failed", failure: { message: "We could not reach the interviewer. Check your connection and try again." } });
      }
    },
    [pathId, say, extra],
  );

  /** The interviewer says a line, then it is the learner's turn. */
  const speakThenListen = useCallback(
    async (turn: Turn, s: Spoken) => {
      setLines((l) => [...l, { who: "ai", text: s.text }]);
      // The screen shows just the question; the full spoken line (with its lead-in) is in the transcript.
      setPhase({ kind: "call", turn, state: "speaking", line: turn.asked });
      setStatus(`Interviewer: ${s.text}`);
      await say(s);
      if (!live.current) return;
      setPhase((p) => (p.kind === "call" && p.state === "speaking" ? { ...p, state: "listening" } : p));
    },
    [say],
  );

  const askQuestion = useCallback(
    (index: number) => {
      const s = script.current;
      if (!s) return;
      warm(s.questions[index + 1]); // ready before it is needed
      void speakThenListen({ index, asked: questions[index].question, followUp: 0 }, s.questions[index]);
    },
    [questions, speakThenListen],
  );

  const nextQuestion = useCallback(
    (index: number, all: Item[]) => {
      if (index + 1 < questions.length) askQuestion(index + 1);
      else if (all.some((i) => i.exchanges.some((e) => e.answer.trim()))) void score(all);
      else setPhase({ kind: "report-failed", failure: { message: "You skipped every question, so there is nothing to score. Start again when you are ready." } });
    },
    [askQuestion, questions.length, score],
  );

  const begin = async () => {
    // Inside the tap: unlock audio for the rest of the interview (phones block sound that no tap started).
    const el = new Audio();
    el.setAttribute("playsinline", "");
    el.preload = "auto";
    el.src = SILENT_WAV;
    void el.play().catch(() => undefined);
    audio.current = el;
    // VI-9: the audio graph for listening must also be created inside the tap.
    const ctx = canRecord() && !typing ? new AudioContext() : null;
    setPhase({ kind: "starting" });
    setStatus("Getting the interviewer ready.");
    try {
      const res = await post("/api/ai/voice/start", { ...extra, questionIds: questions.map((q) => q.id) });
      if (!res.ok) return setPhase({ kind: "stopped", failure: await failureFrom(res) });
      script.current = (await res.json()) as Lines;
    } catch {
      return setPhase({ kind: "stopped", failure: { message: "We could not reach the interviewer. Check your connection and try again." } });
    }
    script.current.acks.forEach(warm);
    if (ctx && script.current.hear) {
      try {
        const m = await openMic(ctx);
        micRef.current = m;
        setMic(m);
        setHear(script.current.hear);
      } catch (e) {
        void ctx.close().catch(() => undefined);
        // Blocked: type instead. Any other failure: the browser's own recogniser still listens.
        if ((e as Error).name === "NotAllowedError") {
          setMicDenied(true);
          setTyping(true);
        }
      }
    } else void ctx?.close().catch(() => undefined);
    setItems(questions.map((q) => ({ questionId: q.id, exchanges: [] })));
    setLines([]);
    setStartedAt(Date.now());
    askQuestion(0);
  };

  const answer = async (turn: Turn, text: string, seconds: number) => {
    const all = items.map((it, i) => (i === turn.index ? { ...it, exchanges: [...it.exchanges, { asked: turn.asked, answer: text, seconds, ...(turn.clarify ? { clarify: true } : {}) }] } : it));
    setItems(all);
    if (!text.trim()) return nextQuestion(turn.index, all);
    setLines((l) => [...l, { who: "me", text }]);
    setPhase({ kind: "call", turn, state: "thinking", line: turn.asked });
    setStatus("The interviewer is thinking.");
    // VI-8: a short "Okay" at once, like a person, while the follow-up is being written.
    const acks = script.current?.acks ?? [];
    const ack = acks.length ? say(acks[ackTurn.current++ % acks.length]) : Promise.resolve();
    try {
      const res = await post("/api/ai/voice/turn", { ...extra, questionId: all[turn.index].questionId, exchanges: all[turn.index].exchanges });
      if (!res.ok) {
        const failure = await failureFrom(res);
        return setPhase({ kind: "stopped", failure });
      }
      const data = (await res.json()) as { follow_up: string | null; audio?: string | null; clarify?: boolean };
      await ack;
      if (!live.current) return;
      if (data.follow_up)
        await speakThenListen(
          { index: turn.index, asked: data.follow_up, followUp: turn.followUp + (data.clarify ? 0 : 1), clarify: data.clarify },
          { text: data.follow_up, audio: data.audio ?? null },
        );
      else nextQuestion(turn.index, all);
    } catch {
      await ack;
      setStatus("We could not reach the interviewer, so we moved on to the next question.");
      nextQuestion(turn.index, all);
    }
  };

  const pause = (p: Extract<Phase, { kind: "call" }>) => {
    quiet();
    setPhase({ ...p, state: "paused" });
    setStatus("Paused.");
  };
  /** VI-10: "Answer now": stop the interviewer mid-sentence and start listening, as on a real call. */
  const interrupt = (p: Extract<Phase, { kind: "call" }>) => {
    quiet();
    setPhase({ ...p, state: "listening" });
    setStatus("Your turn.");
  };
  const resume = (p: Extract<Phase, { kind: "call" }>) => {
    // An interviewer repeats the question after a pause; then it is the learner's turn again.
    const s = last.current;
    if (!s) return setPhase({ ...p, state: "listening" });
    setPhase({ ...p, state: "speaking" });
    void say(s).then(() => live.current && setPhase((q) => (q.kind === "call" && q.state === "speaking" ? { ...q, state: "listening" } : q)));
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
        <Consent
          count={questions.length}
          speechIn={speechIn}
          micDenied={micDenied}
          typing={typing}
          onTyping={setTyping}
          onStart={() => void begin()}
          onBack={onExit}
        />
      )}

      {phase.kind === "starting" && (
        <CallFrame index={0} total={questions.length} followUp={0} startedAt={null}>
          <Focal state="thinking" line="Getting the interviewer ready…" />
        </CallFrame>
      )}

      {phase.kind === "stopped" && <Stopped failure={phase.failure} onExit={onExit} onReport={answeredSoFar ? () => void score(items) : undefined} />}

      {phase.kind === "call" && (
        <>
          <CallFrame index={phase.turn.index} total={questions.length} followUp={phase.turn.followUp} startedAt={startedAt}>
            <Focal state={phase.state} line={phase.line} />
            <Listener
              key={`${phase.turn.index}-${phase.turn.followUp}-${phase.turn.asked}`}
              state={phase.state}
              voice={(!!mic || speechIn) && !typing}
              mic={mic}
              hearUrl={mic && hear ? `/api/ai/voice/hear?t=${hear}&q=${encodeURIComponent(questions[phase.turn.index].id)}` : null}
              onMicBlocked={() => setTyping(true)}
              onTyping={setTyping}
              onAnswer={(text, seconds) => void answer(phase.turn, text, seconds)}
              questionId={questions[phase.turn.index].id}
              asked={phase.turn.asked}
              extra={extra}
              onInterrupt={() => interrupt(phase)}
              onPause={() => pause(phase)}
              onResume={() => resume(phase)}
              onEnd={end}
              endLabel={answeredSoFar ? "End and get my report" : "End the interview"}
            />
            <Transcript lines={lines} />
          </CallFrame>
        </>
      )}

      {phase.kind === "scoring" && (
        <CallFrame index={questions.length - 1} total={questions.length} followUp={0} startedAt={startedAt} done>
          <Focal state="thinking" line="Thank you. Writing your report now; it takes up to a minute." />
          <Transcript lines={lines} />
        </CallFrame>
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

      {phase.kind === "report" && <VoiceReportView report={phase.report} readiness={phase.readiness} trial={trial} onExit={onExit} />}
    </div>
  );
}

// ---- before the call -----------------------------------------------------------

function Consent({
  count,
  speechIn,
  micDenied,
  typing,
  onTyping,
  onStart,
  onBack,
}: {
  count: number;
  speechIn: boolean;
  micDenied: boolean;
  typing: boolean;
  onTyping: (v: boolean) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <section aria-labelledby="consent-heading" className="flex flex-col gap-5 rounded-3xl bg-zinc-100 p-5 leading-7 md:p-8 dark:bg-zinc-900">
      <div className="flex items-center gap-4">
        <Avatar />
        <div>
          <h2 id="consent-heading" className="text-2xl font-semibold tracking-tight">
            Before you start
          </h2>
          <p className={muted}>
            Zarina, your AI interviewer · {count} {count === 1 ? "question" : "questions"} · about {count * 3} minutes
          </p>
        </div>
      </div>
      <p>
        It works like a call. Zarina asks a question and listens; when you finish speaking, she asks a follow-up about
        what you said, then moves on. Find a quiet spot, and use headphones if you can.
      </p>
      <div className="rounded-2xl bg-white p-4 dark:bg-zinc-950" role="note" aria-labelledby="privacy-note">
        <p id="privacy-note" className="font-semibold">
          What is sent to our AI
        </p>
        <p className="mt-1">
          Your spoken answers are recorded in short pieces and sent to Sarvam AI, which turns them into text. Xplaind
          does not keep the recordings; Sarvam handles them under its own terms. Only the text (the transcript) goes to our AI, Anthropic&apos;s Claude,
          to ask follow-ups and score you. Sarvam AI also makes the interviewer&apos;s voice. We keep only your score, not
          what you said.
        </p>
        <p className={`mt-2 text-sm ${muted}`}>
          If Sarvam is not available, your browser&apos;s own speech-to-text is used, which in Chrome and Edge sends audio
          to Google or Microsoft. Prefer not to send your voice anywhere? Type your answers instead.
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
          <input type="checkbox" checked={typing} onChange={(e) => onTyping(e.target.checked)} className="size-5 accent-brand-700" />
          I will type my answers instead of speaking
        </label>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onStart} className={primaryButton}>
          I agree, start the interview
        </button>
        <button type="button" onClick={onBack} className={secondaryButton}>
          Go back
        </button>
      </div>
    </section>
  );
}

// ---- the call ---------------------------------------------------------------------

/** The interviewer's mark: a flat teal disc with her initial. */
function Avatar({ size = "size-12" }: { size?: string }) {
  return (
    <span aria-hidden="true" className={`${size} grid shrink-0 place-items-center rounded-full bg-brand-700 text-lg font-semibold text-white`}>
      Z
    </span>
  );
}

function useClock(startedAt: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (startedAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);
  if (startedAt === null) return "0:00";
  const s = Math.max(0, Math.floor((now - startedAt) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * VI-8: the call screen. It takes over the whole screen like a phone call (the site's header and page are
 * hidden behind it): a deep teal field, the interviewer at the top, progress, the question large in the
 * middle and the controls fixed at the bottom. On a wide screen it keeps a phone-like column.
 */
function CallFrame({
  index,
  total,
  followUp,
  startedAt,
  done = false,
  children,
}: {
  index: number;
  total: number;
  followUp: number;
  startedAt: number | null;
  done?: boolean;
  children: ReactNode;
}) {
  const clock = useClock(startedAt);
  const heading = useRef<HTMLHeadingElement>(null);
  // While the call is open the page behind it does not scroll, and focus starts inside the call.
  useEffect(() => {
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    heading.current?.focus();
    return () => {
      document.body.style.overflow = before;
    };
  }, []);
  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="call-heading"
      className="fixed inset-0 z-[100] overflow-y-auto bg-brand-950 text-white"
    >
      <div className="mx-auto flex min-h-full w-full max-w-xl flex-col gap-6 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-8 md:pt-10">
        <header className="flex items-center gap-3">
          <Avatar size="size-11" />
          <div className="min-w-0 flex-1">
            <h2 id="call-heading" ref={heading} tabIndex={-1} className="font-semibold outline-none">
              Zarina
            </h2>
            <p className="text-sm text-white/75">AI interviewer</p>
          </div>
          <p className="text-sm text-white/75 tabular-nums" aria-label={`Time in interview ${clock}`}>
            {clock}
          </p>
        </header>
        <div>
          <p className="text-sm text-white/75">
            Question {index + 1} of {total}
            {followUp > 0 && ` · follow-up ${followUp}`}
          </p>
          <div className="mt-2 flex gap-1.5" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={`h-1 flex-1 rounded-full ${done || i < index ? "bg-white" : i === index ? "bg-brand-300" : "bg-white/20"}`} />
            ))}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

const STATE_WORDS: Record<CallState, string> = { speaking: "Zarina is speaking", listening: "Your turn", thinking: "Zarina is thinking", paused: "Paused" };

/** Five bars that move with the voice of whoever is talking; still when motion is reduced (VI-5). */
function VoiceBars({ active, tone }: { active: boolean; tone: "white" | "teal" }) {
  const colour = tone === "white" ? "bg-white" : "bg-brand-300";
  return (
    <span className="flex h-6 items-center gap-1" aria-hidden="true">
      {[0.45, 0.8, 1, 0.7, 0.5].map((h, i) => (
        <span
          key={i}
          className={`w-1 origin-center rounded-full ${colour} ${active ? "motion-safe:animate-[xp-voice_0.9s_ease-in-out_infinite]" : ""}`}
          style={{ height: `${Math.round(h * 24)}px`, animationDelay: `${i * 0.12}s`, transform: active ? undefined : "scaleY(0.3)" }}
        />
      ))}
    </span>
  );
}

/** What the interviewer is saying, large: the one thing to read on the screen. */
function Focal({ state, line }: { state: CallState; line: string }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-4">
      <p className="flex items-center gap-3 text-sm font-medium text-white/80" role="status">
        {state === "thinking" ? (
          <span className="flex gap-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-1.5 rounded-full bg-white motion-safe:animate-[xp-think_1.2s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </span>
        ) : (
          <VoiceBars active={state === "speaking"} tone="white" />
        )}
        {STATE_WORDS[state]}
      </p>
      <p className="text-2xl leading-snug font-semibold tracking-tight text-balance md:text-3xl">{line}</p>
    </div>
  );
}

function RoundButton({
  label,
  onClick,
  children,
  tone = "plain",
  pressed,
  disabled,
  title,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  tone?: "plain" | "primary" | "end";
  pressed?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  const fill = tone === "primary" ? "bg-white text-brand-950 hover:bg-brand-50" : tone === "end" ? "bg-rose-600 text-white hover:bg-rose-700" : "xp-glass-btn-dark text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      title={title}
      className="group flex w-16 flex-col items-center gap-1.5 text-xs text-white/85 disabled:opacity-40"
    >
      <span
        className={`grid size-14 place-items-center rounded-full transition-transform duration-100 group-active:scale-95 group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-white ${fill}`}
      >
        {children}
      </span>
      {label}
    </button>
  );
}

const svg = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const PauseIcon = () => (
  <svg {...svg}>
    <path d="M9 5v14M15 5v14" />
  </svg>
);
const PlayIcon = () => (
  <svg {...svg}>
    <path d="M7 5l12 7-12 7z" />
  </svg>
);
const KeyboardIcon = () => (
  <svg {...svg}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" />
  </svg>
);
const MicIcon = () => (
  <svg {...svg}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);
const CheckIcon = () => (
  <svg {...svg}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
const EndIcon = () => (
  <svg {...svg} strokeWidth={2.2}>
    <path d="M3 14c5-4.5 13-4.5 18 0l-2.5 2.5-3-1.5v-2.5a10 10 0 0 0-5 0V15l-3 1.5z" />
  </svg>
);

// ---- the learner's turn ------------------------------------------------------------

const FILLER = /\b(um+|uh+|erm+|hmm+|ah+)\b[,.]?\s*/gi;
/** The caption without "um" and "uh": they are still counted in the report, but they are noise to read. */
const caption = (text: string) => text.replace(FILLER, "").replace(/\s{2,}/g, " ").trim();

/**
 * VI-7 to VI-9: hands-free listening. With Sarvam on (VI-9), the answer is recorded in pieces and each is
 * transcribed as the learner talks; silence is measured from the microphone itself. Otherwise the
 * browser's own recogniser listens. An answer is sent after 5 seconds of silence, 7 after a trailing "and"
 * or "um" (pauseToSend); just before, the caption says so and offers "Hold on", which waits for "Done".
 */
function Listener({
  state,
  voice,
  mic,
  hearUrl,
  questionId,
  asked,
  extra,
  onMicBlocked,
  onTyping,
  onAnswer,
  onInterrupt,
  onPause,
  onResume,
  onEnd,
  endLabel,
}: {
  state: CallState;
  voice: boolean;
  mic: Mic | null;
  hearUrl: string | null;
  questionId: string;
  asked: string;
  extra: Record<string, unknown>;
  onMicBlocked: () => void;
  onTyping: (v: boolean) => void;
  onAnswer: (text: string, seconds: number) => void;
  onInterrupt: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  endLabel: string;
}) {
  const sarvam = !!mic && !!hearUrl;
  /** When the learner started answering, for the pace in the report. Not shown, so a ref. */
  const startedAt = useRef<number | null>(null);
  const [held, setHeld] = useState(false);
  const [sendingIn, setSendingIn] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const sent = useRef(false);
  const onStart = useCallback(() => {
    startedAt.current ??= Date.now();
  }, []);
  const dictation = useDictation({ onStart, onBlocked: onMicBlocked });
  const capture = useVoiceCapture({ mic, hearUrl, onFailed: setProblem });
  const said = sarvam ? capture.text : joinText(dictation.text, dictation.interim).trim();
  const hearing = sarvam ? capture.voiced : !!dictation.interim;
  const listening = sarvam ? capture.listening : dictation.listening;
  const notice = problem ?? dictation.notice;
  const spoke = sarvam ? capture.spoke : !!said;
  useEffect(() => {
    if (spoke) onStart();
  }, [spoke, onStart]);

  const send = useCallback(
    async (skip = false) => {
      if (sent.current) return;
      sent.current = true;
      const seconds = startedAt.current === null ? 0 : Math.min(MAX_SECONDS, Math.round((Date.now() - startedAt.current) / 1000));
      if (skip) {
        capture.abort();
        dictation.abort();
        return onAnswer("", seconds);
      }
      if (sarvam) {
        setFinishing(true);
        const heard = await capture.finish();
        if (!heard) {
          // Nothing came back in time (a slow connection): never treat that as a skipped question.
          sent.current = false;
          setFinishing(false);
          setProblem("We couldn't catch that answer. Please say it again, or tap Type to type it.");
          capture.start();
          return;
        }
        onAnswer(heard, seconds);
      } else {
        dictation.abort();
        onAnswer(said, seconds);
      }
    },
    [capture, dictation, onAnswer, said, sarvam],
  );

  // The microphone opens by itself, once, when it is the learner's turn, and is muted otherwise.
  const opened = useRef(false);
  useEffect(() => {
    if (state === "listening" && voice && !sent.current && !opened.current) {
      opened.current = true;
      if (sarvam) capture.start();
      else dictation.start();
    }
    if (state !== "listening" && opened.current) {
      opened.current = false;
      capture.abort();
      dictation.abort();
    }
  }, [state, voice, sarvam, capture, dictation]);

  // VI-9: the browser recogniser has no sound level, so its silence is the time since the words last changed.
  const changedAt = useRef(0);
  useEffect(() => {
    changedAt.current = Date.now();
  }, [said]);

  // Every 200 ms: how long has the learner been quiet, and is it time to warn or to send? The latest values
  // are read from a ref, so the clock keeps a steady beat however often the caption changes.
  // VI-10: after a short pause the fast model is asked whether the answer is finished; if so it is sent
  // after about 2 seconds of silence, otherwise the patient 5 or 7 seconds apply.
  const latest = useRef({ sarvam, capture, said, spoke, send });
  useEffect(() => {
    latest.current = { sarvam, capture, said, spoke, send };
  });
  const judged = useRef<{ text: string; finished: boolean } | null>(null);
  const checking = useRef<string | null>(null);
  useEffect(() => {
    if (state !== "listening" || !voice || held) return;
    const id = window.setInterval(() => {
      const l = latest.current;
      if (sent.current) return;
      const now = Date.now();
      const quiet = l.sarvam ? l.capture.quiet(now) : l.said ? now - changedAt.current : 0;
      if (!l.spoke || quiet === 0) return setSendingIn(null);
      const text = l.said;
      if (shouldCheckEnd(text, quiet) && checking.current !== text && judged.current?.text !== text && !(l.sarvam && l.capture.pending)) {
        checking.current = text;
        void fetch("/api/ai/voice/end", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...extra, questionId, asked, answer: text }) })
          .then((r) => (r.ok ? (r.json() as Promise<{ finished: boolean }>) : { finished: false }))
          .then((r) => {
            if (checking.current === text) judged.current = { text, finished: r.finished };
          })
          .catch(() => undefined);
      }
      const early = judged.current?.text === text && judged.current.finished;
      const left = (early ? Math.min(EARLY_SEND_MS, pauseToSend(text || "…")) : pauseToSend(text || "…")) - quiet;
      if (left <= 0) {
        setSendingIn(null);
        void l.send();
      } else setSendingIn(left <= WARN_MS ? left : null);
    }, 200);
    return () => window.clearInterval(id);
  }, [state, voice, held, questionId, asked, extra]);

  const myTurn = state === "listening";
  const shown = caption(said);
  return (
    <>
      {myTurn && voice && (
        <div className="flex flex-col gap-3 rounded-2xl bg-white/[0.06] p-4" aria-live="off">
          <p className="flex items-center gap-3 text-sm font-medium text-brand-300">
            <VoiceBars active={listening && hearing} tone="teal" />
            {finishing
              ? "Sending…"
              : sendingIn !== null && !held
                ? "Sending in a moment…"
                : held
                  ? "Take your time. Tap Done when you finish."
                  : listening
                    ? hearing
                      ? "Listening"
                      : spoke
                        ? "Listening. Take your time."
                        : "Listening"
                    : "Starting the microphone…"}
          </p>
          <p className="min-h-14 text-lg leading-8">
            {shown || <span className="text-white/60">{sarvam && capture.pending ? "Writing down what you said…" : "Go ahead, answer out loud."}</span>}
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {sendingIn !== null && !held && (
              <button type="button" onClick={() => setHeld(true)} className="font-medium text-white underline underline-offset-4">
                Hold on, I&apos;m not done
              </button>
            )}
            {!sarvam && !listening && !said && notice && (
              <button type="button" onClick={dictation.start} className="font-medium text-white underline underline-offset-4">
                Tap to answer
              </button>
            )}
            <button type="button" onClick={() => void send(true)} className="text-white/75 underline underline-offset-4 hover:text-white">
              Skip this question
            </button>
          </div>
        </div>
      )}

      {notice && (
        <p role="alert" className="rounded-2xl bg-amber-100 p-3 text-amber-950">
          {notice}
        </p>
      )}

      {myTurn && !voice && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (dictation.text.trim()) void send();
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-white/85">Your answer</span>
            <textarea
              value={dictation.text}
              onChange={(e) => {
                onStart();
                dictation.setText(e.target.value);
              }}
              rows={4}
              placeholder="Type your answer as you would say it…"
              className="rounded-2xl bg-white p-3 leading-7 text-zinc-950 placeholder:text-zinc-500"
            />
          </label>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <button type="submit" className="min-h-11 rounded-full bg-white px-5 font-medium text-brand-950 disabled:opacity-50" disabled={!dictation.text.trim()}>
              Send answer
            </button>
            <button type="button" onClick={() => void send(true)} className="text-sm text-white/75 underline underline-offset-4 hover:text-white">
              Skip this question
            </button>
          </div>
        </form>
      )}

      <div className="mt-auto flex items-start justify-center gap-4 pt-2">
        {state === "paused" ? (
          <RoundButton label="Resume" onClick={onResume} tone="primary">
            <PlayIcon />
          </RoundButton>
        ) : (
          <RoundButton label="Pause" onClick={onPause} disabled={state === "thinking"}>
            <PauseIcon />
          </RoundButton>
        )}
        {voice ? (
          <RoundButton label="Type" onClick={() => onTyping(true)}>
            <KeyboardIcon />
          </RoundButton>
        ) : (
          <RoundButton label="Speak" onClick={() => onTyping(false)}>
            <MicIcon />
          </RoundButton>
        )}
        {state === "speaking" ? (
          <RoundButton label="Answer now" onClick={onInterrupt} tone="primary">
            <MicIcon />
          </RoundButton>
        ) : (
          voice && (
            <RoundButton label="Done" onClick={() => void send()} tone="primary" disabled={!myTurn || !spoke || finishing}>
              <CheckIcon />
            </RoundButton>
          )
        )}
        <RoundButton label="End" title={endLabel} onClick={onEnd} tone="end">
          <EndIcon />
        </RoundButton>
      </div>
    </>
  );
}

// ---- the transcript ------------------------------------------------------------------

/** The conversation so far, folded away under the controls so the call stays calm. It scrolls itself (NV-4). */
function Transcript({ lines }: { lines: Line[] }) {
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [lines.length]);
  if (lines.length === 0) return null;
  return (
    <details className="rounded-2xl bg-white/[0.06] px-4 py-2">
      <summary className="min-h-11 cursor-pointer content-center text-sm font-medium text-white/85">Transcript ({lines.length})</summary>
      <ol ref={list} tabIndex={0} aria-label="Transcript" className="mt-1 flex max-h-64 flex-col gap-3 overflow-y-auto pb-2 text-sm leading-6 text-white/90">
        {lines.map((l, i) => (
          <li key={i}>
            <span className="font-semibold text-white">{l.who === "ai" ? "Zarina" : "You"}: </span>
            {l.text}
          </li>
        ))}
      </ol>
    </details>
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

function VoiceReportView({ report, readiness, trial, onExit }: { report: VoiceReport; readiness: Readiness | null; trial: boolean; onExit: () => void }) {
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
          <p className="mt-3 leading-7">
            <span className="font-semibold">Verdict: {report.verdict.label}.</span> {report.verdict.reason}
          </p>
          {report.summary && <p className="mt-2 leading-7">{report.summary}</p>}
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

      {report.competencies.length > 0 && (
        <section aria-labelledby="skills-heading" className="flex flex-col gap-3">
          <h3 id="skills-heading" className="text-xl font-semibold">
            Skills for this role
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {report.competencies.map((k) => (
              <li key={k.name} className={`${card} break-inside-avoid`}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-semibold leading-6">{k.name}</p>
                  <p className="shrink-0 font-semibold tabular-nums">{outOf5(k.score)}</p>
                </div>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
                  role="meter"
                  aria-label={`${k.name} score`}
                  aria-valuemin={0}
                  aria-valuemax={5}
                  aria-valuenow={k.score}
                >
                  <div className="h-full bg-brand-700" style={{ width: `${k.score * 20}%` }} />
                </div>
                {k.note && <p className="mt-2 text-sm leading-6">{k.note}</p>}
                {k.evidence.map((e) => (
                  <p key={e} className={`mt-1 text-sm leading-6 ${muted}`}>
                    You said: “{e}”
                  </p>
                ))}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(report.strengths.length > 0 || report.risks.length > 0) && (
        <div className="grid gap-6 sm:grid-cols-2">
          {([
            ["strengths-heading", "Strengths", report.strengths],
            ["risks-heading", "What an interviewer may worry about", report.risks],
          ] as const).map(([id, title, items]) =>
            items.length > 0 ? (
              <section key={id} aria-labelledby={id}>
                <h3 id={id} className="text-xl font-semibold">
                  {title}
                </h3>
                <ul className="mt-3 flex flex-col gap-3 leading-7">
                  {items.map((x) => (
                    <li key={x.text}>
                      {x.text}
                      {x.evidence && <span className={`block text-sm leading-6 ${muted}`}>You said: “{x.evidence}”</span>}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null,
          )}
        </div>
      )}

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

      {report.plan.length > 0 && (
        <section aria-labelledby="plan-heading">
          <h3 id="plan-heading" className="text-xl font-semibold">
            Your next four weeks
          </h3>
          <ol className="mt-3 flex flex-col gap-3">
            {report.plan.map((w) => (
              <li key={w.week} className={`${card} break-inside-avoid`}>
                <p className="font-semibold">
                  Week {w.week}: {w.focus}
                </p>
                <p className="mt-1 leading-7">{w.action}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm">
            <Link href="/plan" className={textLink}>
              Open your weekly plan
            </Link>{" "}
            to fit these into your study time.
          </p>
        </section>
      )}

      <section aria-labelledby="voice-each-heading" className="flex flex-col gap-4">
        <h3 id="voice-each-heading" className="text-xl font-semibold">
          Question by question
        </h3>
        {report.questions.map((q, i) => (
          <article key={q.questionId} className={`${card} break-inside-avoid`}>
            <div className="flex items-baseline justify-between gap-3">
              <h4 className="font-semibold leading-7">
                {i + 1}. {q.question}
              </h4>
              {q.answered && <p className="shrink-0 font-semibold tabular-nums">{outOf5(q.score)}</p>}
            </div>
            <p className={`mt-1 text-sm ${muted}`}>
              {q.answered ? `${q.coverage}% of key points · depth ${outOf5(q.depth)} · ${q.followUps} follow-up${q.followUps === 1 ? "" : "s"}` : "Not answered"}
            </p>
            {q.depthNote && <p className="mt-2 text-sm leading-6">{q.depthNote}</p>}
            {q.wentWell.length > 0 && (
              <>
                <h5 className="mt-3 text-sm font-semibold">What went well</h5>
                <ul className="mt-1 list-disc pl-5 text-sm leading-6">
                  {q.wentWell.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </>
            )}
            {q.gaps.length > 0 && (
              <>
                <h5 className="mt-3 text-sm font-semibold">What was missing</h5>
                <ul className="mt-1 list-disc pl-5 text-sm leading-6">
                  {q.gaps.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </>
            )}
            {q.followUpHandling && (
              <p className="mt-3 text-sm leading-6">
                <span className="font-semibold">Follow-ups:</span> {q.followUpHandling}
              </p>
            )}
            {q.answered && (
              <p className="mt-2 text-sm leading-6">
                <span className="font-semibold">How you said it:</span> {q.delivery.words} words
                {q.delivery.wordsPerMinute !== null && `, ${q.delivery.wordsPerMinute} a minute`}, {q.delivery.fillers} filler word
                {q.delivery.fillers === 1 ? "" : "s"}
                {q.delivery.hedges.length > 0 && `; hedging: ${q.delivery.hedges.map((h) => `“${h}”`).join(", ")}`}.
              </p>
            )}
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
            {isCustomId(q.questionId) ? (
              <p className={`mt-2 text-sm ${muted}`}>Written for this job description, so it is not in our question bank.</p>
            ) : (
              <p className="mt-2 text-sm">
                <Link href={`/interview/${q.questionId}`} className={textLink}>
                  Full answer and follow-ups
                </Link>
              </p>
            )}
          </article>
        ))}
      </section>

      {trial && (
        <section aria-labelledby="voice-trial-heading" className={`${card} flex flex-col gap-3 print:hidden`}>
          <h3 id="voice-trial-heading" className="text-xl font-semibold">
            That was your free AI interview
          </h3>
          <p className="leading-7">
            With Pro, Zarina interviews you every day: 3 or 5 questions at a time, set up from any job post you paste, each with a report like this one.
            Passes start at ₹99 for 7 days, paid once, with no auto-renewal.
          </p>
          <Link href="/pricing" className={`${primaryButton} self-start`}>
            Get Pro
          </Link>
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row print:hidden">
        <button type="button" onClick={onExit} className={trial ? secondaryButton : primaryButton}>
          {trial ? "Back to the mock interview" : "New interview"}
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
