// VI-9: voice activity from the microphone's sound level, for the AI interviewer. It finds when the learner
// is speaking, when they have gone quiet, and where to cut the recording into short pieces for
// speech-to-text (at a short pause, and never longer than Sarvam's 30-second limit). Measuring the sound
// itself, not the recogniser's guesses, is what lets a long thinking pause be told from the end of an
// answer. Pure: no browser APIs, for tests.

/** A pause this long between phrases closes a piece of audio and sends it to be transcribed. */
export const PIECE_GAP_MS = 700;
/** No piece is longer than this (Sarvam's REST limit is 30 seconds). */
export const MAX_PIECE_MS = 25_000;
/** Below this the room is treated as silent whatever the noise estimate says. */
const MIN_THRESHOLD = 0.012;

export type Vad = {
  /** A running estimate of the room's background level. */
  noise: number;
  /** Speech is heard right now. */
  voiced: boolean;
  /** When speech was last heard (ms), or null before the first word. */
  lastVoiceAt: number | null;
  /** When the current piece of audio began. */
  pieceStart: number;
  /** The current piece holds speech (pieces of pure silence are never sent). */
  heardInPiece: boolean;
};

/** A fresh state. `noise` is the room's level measured just before listening (the hook takes a moment to measure). */
export const newVad = (now: number, noise = 0.005): Vad => ({ noise, voiced: false, lastVoiceAt: null, pieceStart: now, heardInPiece: false });

/** The loudness (root mean square) of one frame of samples between -1 and 1. */
export function loudness(samples: ArrayLike<number>): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

/** Speech is anything clearly louder than the room. */
export const speechThreshold = (noise: number): number => Math.max(MIN_THRESHOLD, noise * 3);

/**
 * One step: given the level heard now, the new state, and whether to cut the current piece here (after a
 * short pause in speech, or when it reaches the maximum length).
 */
export function stepVad(v: Vad, level: number, now: number): { vad: Vad; cut: boolean } {
  const voiced = level > speechThreshold(v.noise);
  // The noise estimate falls quickly in quiet and creeps up slowly while loud, so a steady sound such as a
  // fan stops counting as speech within a few seconds, while real speech stays far above it.
  const noise = voiced ? v.noise * 0.995 + Math.min(level, 0.05) * 0.005 : v.noise * 0.95 + Math.min(level, 0.05) * 0.05;
  const next: Vad = voiced ? { ...v, noise, voiced, lastVoiceAt: now, heardInPiece: true } : { ...v, noise, voiced };
  const paused = next.heardInPiece && next.lastVoiceAt !== null && !voiced && now - next.lastVoiceAt >= PIECE_GAP_MS;
  const full = next.heardInPiece && now - next.pieceStart >= MAX_PIECE_MS;
  if (!paused && !full) return { vad: next, cut: false };
  return { vad: { ...next, pieceStart: now, heardInPiece: false }, cut: true };
}

/** How long the learner has been quiet (ms), counting only after they started speaking. */
export const quietFor = (v: Vad, now: number): number => (v.voiced || v.lastVoiceAt === null ? 0 : now - v.lastVoiceAt);
