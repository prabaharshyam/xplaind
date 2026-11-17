"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { card, muted, primaryButton, secondaryButton, textLink } from "@/components/ui";
import { MIC_BLOCKED, joinText, speak, stopSpeaking, useDictation, useSpeechSupported } from "@/components/interview/speech";
import { readinessLabel, type Readiness } from "@/lib/interview/readiness";
import type { SimQuestion } from "@/lib/interview/analyse";
import { pauseToSend, type Exchange, type VoiceReport } from "@/lib/ai/voice-interview";

/**
 * VI-1 to VI-8: the AI voice interviewer (Pro), as a call. One tap starts it. The interviewer speaks in a
 * natural voice streamed as it is made (VI-6, VI-8), the microphone opens by itself, and a pause sends the
 * answer, longer when the learner trails off mid-thought (VI-8). It says a short "Okay" at once, then a
 * follow-up about what was said, moves on, and ends with a scored report. Speech-to-text runs in this
 * browser; only text is sent (VI-2).
 */

type Item = { questionId: string; exchanges: Exchange[] };
type Turn = { index: number; asked: string; followUp: number };
type Failure = { message: string; upgrade?: string; signin?: boolean };
/** One spoken line: its words, and a URL for its natural voice (null: the browser reads it). */
type Spoken = { text: string; audio: string | null };
type Line = { who: "ai" | "me"; text: string };
type Lines = { questions: Spoken[]; acks: Spoken[]; closing: Spoken };
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

export function VoiceInterviewer({ questions, pathId, onExit }: { questions: SimQuestion[]; pathId: string | null; onExit: () => void }) {
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
        const res = await post("/api/ai/voice/report", { ...(pathId ? { pathId } : {}), items: all.filter((i) => i.exchanges.length > 0) });
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
    setPhase({ kind: "starting" });
    setStatus("Getting the interviewer ready.");
    try {
      const res = await post("/api/ai/voice/start", { questionIds: questions.map((q) => q.id) });
      if (!res.ok) return setPhase({ kind: "stopped", failure: await failureFrom(res) });
      script.current = (await res.json()) as Lines;
    } catch {
      return setPhase({ kind: "stopped", failure: { message: "We could not reach the interviewer. Check your connection and try again." } });
    }
    script.current.acks.forEach(warm);
    setItems(questions.map((q) => ({ questionId: q.id, exchanges: [] })));
    setLines([]);
    setStartedAt(Date.now());
    askQuestion(0);
  };

  const answer = async (turn: Turn, text: string, seconds: number) => {
    const all = items.map((it, i) => (i === turn.index ? { ...it, exchanges: [...it.exchanges, { asked: turn.asked, answer: text, seconds }] } : it));
    setItems(all);
    if (!text.trim()) return nextQuestion(turn.index, all);
    setLines((l) => [...l, { who: "me", text }]);
    setPhase({ kind: "call", turn, state: "thinking", line: turn.asked });
    setStatus("The interviewer is thinking.");
    // VI-8: a short "Okay" at once, like a person, while the follow-up is being written.
    const acks = script.current?.acks ?? [];
    const ack = acks.length ? say(acks[ackTurn.current++ % acks.length]) : Promise.resolve();
    try {
      const res = await post("/api/ai/voice/turn", { questionId: all[turn.index].questionId, exchanges: all[turn.index].exchanges });
      if (!res.ok) {
        const failure = await failureFrom(res);
        return setPhase({ kind: "stopped", failure });
      }
      const data = (await res.json()) as { follow_up: string | null; audio?: string | null };
      await ack;
      if (!live.current) return;
      if (data.follow_up) await speakThenListen({ index: turn.index, asked: data.follow_up, followUp: turn.followUp + 1 }, { text: data.follow_up, audio: data.audio ?? null });
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
              key={`${phase.turn.index}-${phase.turn.followUp}`}
              state={phase.state}
              voice={speechIn && !typing}
              onMicBlocked={() => setTyping(true)}
              onTyping={setTyping}
              onAnswer={(text, seconds) => void answer(phase.turn, text, seconds)}
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

      {phase.kind === "report" && <VoiceReportView report={phase.report} readiness={phase.readiness} onExit={onExit} />}
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
  const fill = tone === "primary" ? "bg-white text-brand-950 hover:bg-brand-50" : tone === "end" ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-white/10 text-white hover:bg-white/20";
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

/**
 * VI-7 and VI-8: hands-free listening. The microphone opens by itself, what is heard shows as a caption,
 * and a pause sends it: longer if the learner trails off on "and" or "um" (pauseToSend). Just before an
 * automatic send the caption says so and offers "Hold on", which waits for "Done". Pause, typing and End
 * are always one tap away. If a phone will not open the microphone without a tap, "Tap to answer" shows.
 */
function Listener({
  state,
  voice,
  onMicBlocked,
  onTyping,
  onAnswer,
  onPause,
  onResume,
  onEnd,
  endLabel,
}: {
  state: CallState;
  voice: boolean;
  onMicBlocked: () => void;
  onTyping: (v: boolean) => void;
  onAnswer: (text: string, seconds: number) => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  endLabel: string;
}) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [held, setHeld] = useState(false);
  // The answer text the "Sending" warning was raised for; new words make it stale, so it hides by itself.
  const [warnedFor, setWarnedFor] = useState<string | null>(null);
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

  // VI-8: a pause ends the answer. Every new word restarts the clock; "Sending" shows just before.
  useEffect(() => {
    if (state !== "listening" || !voice || !said || sent.current || held) return;
    const wait = pauseToSend(said);
    const warn = window.setTimeout(() => setWarnedFor(said), Math.max(0, wait - WARN_MS));
    const go = window.setTimeout(() => send(), wait);
    return () => {
      window.clearTimeout(warn);
      window.clearTimeout(go);
    };
  }, [said, state, voice, held, send]);

  const myTurn = state === "listening";
  const sending = myTurn && !held && warnedFor !== null && warnedFor === said;
  return (
    <>
      {myTurn && voice && (
        <div className="flex flex-col gap-3 rounded-2xl bg-white/[0.06] p-4" aria-live="off">
          <p className="flex items-center gap-3 text-sm font-medium text-brand-300">
            <VoiceBars active={listening && !!interim} tone="teal" />
            {sending ? "Sending in a moment…" : held ? "Take your time. Tap Done when you finish." : listening ? "Listening" : "Starting the microphone…"}
          </p>
          <p className="min-h-14 text-lg leading-8">{said || <span className="text-white/60">Go ahead, answer out loud.</span>}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {sending && !held && (
              <button type="button" onClick={() => setHeld(true)} className="font-medium text-white underline underline-offset-4">
                Hold on, I&apos;m not done
              </button>
            )}
            {!listening && !said && notice && (
              <button type="button" onClick={start} className="font-medium text-white underline underline-offset-4">
                Tap to answer
              </button>
            )}
            <button type="button" onClick={() => send(true)} className="text-white/75 underline underline-offset-4 hover:text-white">
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
            if (text.trim()) send();
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-white/85">Your answer</span>
            <textarea
              value={text}
              onChange={(e) => {
                onStart();
                setText(e.target.value);
              }}
              rows={4}
              placeholder="Type your answer as you would say it…"
              className="rounded-2xl bg-white p-3 leading-7 text-zinc-950 placeholder:text-zinc-500"
            />
          </label>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <button type="submit" className="min-h-11 rounded-full bg-white px-5 font-medium text-brand-950 disabled:opacity-50" disabled={!text.trim()}>
              Send answer
            </button>
            <button type="button" onClick={() => send(true)} className="text-sm text-white/75 underline underline-offset-4 hover:text-white">
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
        {voice && (
          <RoundButton label="Done" onClick={() => send()} tone="primary" disabled={!myTurn || !said}>
            <CheckIcon />
          </RoundButton>
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
