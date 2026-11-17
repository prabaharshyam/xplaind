"use client";
// VI-9: records the learner's spoken answer in short pieces, cut at natural pauses, and has each piece
// transcribed by Sarvam AI through /api/ai/voice/hear while they keep talking, so the text is ready when they
// finish. Speech and silence are measured from the microphone's level (lib/interview/vad), which is what
// lets a long thinking pause be told from the end of an answer. The microphone is muted whenever it is not
// the learner's turn, so the interviewer's voice is never recorded. Audio is never stored by Xplaind.

import { useCallback, useEffect, useRef, useState } from "react";
import { loudness, newVad, quietFor, stepVad, type Vad } from "@/lib/interview/vad";

/** The microphone and audio graph, opened once for the whole interview (inside the Start tap). */
export type Mic = { stream: MediaStream; ctx: AudioContext; analyser: AnalyserNode; type: string };

const TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
const FRAME_MS = 50;
/** One piece never waits longer than this for its text; a stuck request must not freeze the call. */
const PIECE_TIMEOUT_MS = 15_000;
/** When the answer ends, its last pieces get at most this long before the answer is sent with what is back. */
const FINISH_WAIT_MS = 8_000;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
type Piece = MediaRecorder & { markHeard?: () => void; done?: Promise<void> };
/** The room is measured for this long at the start of each turn before speech is looked for. */
const CALIBRATE_MS = 300;

/** Whether this browser can record pieces of audio (MediaRecorder and the microphone). */
export const canRecord = (): boolean =>
  typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

/** Opens the microphone for the interview. Throws the browser's error (NotAllowedError when blocked). */
export async function openMic(ctx: AudioContext): Promise<Mic> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  stream.getAudioTracks().forEach((t) => (t.enabled = false));
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  ctx.createMediaStreamSource(stream).connect(analyser);
  const type = TYPES.find((t) => MediaRecorder.isTypeSupported?.(t)) ?? "";
  return { stream, ctx, analyser, type };
}

export const closeMic = (mic: Mic | null) => {
  mic?.stream.getTracks().forEach((t) => t.stop());
  void mic?.ctx.close().catch(() => undefined);
};

/**
 * Captures one answer. `start` unmutes the microphone and begins; `finish` sends the last piece and
 * resolves with the whole text once every piece is back; `abort` stops without sending.
 */
export function useVoiceCapture({ mic, hearUrl, onFailed }: { mic: Mic | null; hearUrl: string | null; onFailed: (message: string) => void }) {
  const [text, setText] = useState("");
  const [voiced, setVoiced] = useState(false);
  const [listening, setListening] = useState(false);
  const [pending, setPending] = useState(0);
  /** The learner has started speaking in this answer (set once, so the screen does not re-render per frame). */
  const [spoke, setSpoke] = useState(false);
  const vad = useRef<Vad | null>(null);
  const timer = useRef<number | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const pieces = useRef<string[]>([]);
  const inflight = useRef<Promise<void>[]>([]);
  const failures = useRef(0);

  const upload = useCallback(
    (blob: Blob, index: number) => {
      if (!hearUrl) return;
      setPending((n) => n + 1);
      const job = fetch(hearUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type.split(";")[0] || "audio/webm" },
        body: blob,
        signal: AbortSignal.timeout(PIECE_TIMEOUT_MS),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(String(res.status));
          const { text: heard } = (await res.json()) as { text: string };
          pieces.current[index] = heard;
          setText(pieces.current.filter(Boolean).join(" "));
        })
        .catch(() => {
          failures.current++;
          onFailed(failures.current > 2 ? "We are having trouble hearing you. Check your connection, or type your answer." : "We could not hear part of that clearly. Please say it again.");
        })
        .finally(() => setPending((n) => n - 1));
      inflight.current.push(job);
    },
    [hearUrl, onFailed],
  );

  /** Starts a new piece; when it stops, sends it if it held speech. */
  const record = useCallback(() => {
    if (!mic) return;
    const rec: Piece = new MediaRecorder(mic.stream, mic.type ? { mimeType: mic.type } : undefined);
    const chunks: Blob[] = [];
    const index = pieces.current.length;
    pieces.current.push("");
    let heard = false;
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    // `done` resolves once the piece is handed over and (if it held speech) its upload has started.
    rec.done = new Promise<void>((resolve) => {
      rec.onstop = () => {
        if (heard && chunks.length) upload(new Blob(chunks, { type: chunks[0].type || mic.type }), index);
        resolve();
      };
    });
    rec.markHeard = () => (heard = true);
    rec.start();
    recorder.current = rec;
  }, [mic, upload]);

  /** Closes the current piece (it is sent if it held speech) and, if asked, starts the next one. */
  const cut = useCallback(
    (again: boolean): Promise<void> => {
      const rec = recorder.current as Piece | null;
      let done = Promise.resolve();
      if (rec && rec.state !== "inactive") {
        rec.stop();
        done = rec.done ?? done;
      }
      recorder.current = null;
      if (again) record();
      return done;
    },
    [record],
  );

  const stopLoop = () => {
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = null;
    mic?.stream.getAudioTracks().forEach((t) => (t.enabled = false));
    setListening(false);
    setVoiced(false);
  };

  const start = useCallback(() => {
    if (!mic || timer.current !== null) return;
    void mic.ctx.resume().catch(() => undefined);
    mic.stream.getAudioTracks().forEach((t) => (t.enabled = true));
    const buf = new Float32Array(mic.analyser.fftSize);
    const began = Date.now();
    const room: number[] = [];
    record();
    setListening(true);
    timer.current = window.setInterval(() => {
      mic.analyser.getFloatTimeDomainData(buf);
      const level = loudness(buf);
      const now = Date.now();
      if (now - began < CALIBRATE_MS) return void room.push(level);
      if (!vad.current) vad.current = newVad(now, room.length ? room.reduce((a, b) => a + b, 0) / room.length : undefined);
      const { vad: next, cut: shouldCut } = stepVad(vad.current, level, now);
      if (next.voiced) (recorder.current as Piece | null)?.markHeard?.();
      const was = vad.current;
      vad.current = next;
      if (next.voiced !== was.voiced) setVoiced(next.voiced);
      if (next.lastVoiceAt !== null && was.lastVoiceAt === null) setSpoke(true);
      if (shouldCut) void cut(true);
    }, FRAME_MS);
  }, [mic, record, cut]);

  /** Sends the last piece and resolves with the whole answer once every piece is transcribed. */
  const finish = useCallback(async (): Promise<string> => {
    stopLoop();
    // Wait for the last piece to be handed over (so the end of the answer is not lost), then for every
    // piece's text, but never for long: a slow request must not freeze the call.
    await Promise.race([cut(false), sleep(1500)]);
    await Promise.race([Promise.allSettled(inflight.current), sleep(FINISH_WAIT_MS)]);
    return pieces.current.filter(Boolean).join(" ").trim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cut]);

  const abort = useCallback(() => {
    stopLoop();
    const rec = recorder.current;
    if (rec && rec.state !== "inactive") {
      rec.onstop = null;
      rec.stop();
    }
    recorder.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => abort(), [abort]);

  /** How long the learner has been quiet since they last spoke (0 while speaking or before the first word). */
  const quiet = (now: number) => (vad.current ? quietFor(vad.current, now) : 0);

  return { text, voiced, listening, pending, spoke, start, finish, abort, quiet };
}
