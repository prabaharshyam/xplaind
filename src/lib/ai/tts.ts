// VI-6 (2026-11-17, owner request): the AI interviewer speaks in a natural Indian English voice from
// Sarvam AI (Bulbul v4 Flash, voice "zarina_en_conversation", chosen by the owner from six samples).
// Only the interviewer's own lines are sent, and every line is written on our server (bank questions,
// fixed lead-ins, the model's follow-ups), so the browser cannot use this to voice any text it likes.
// The learner's voice never goes here (VI-2). Without SARVAM_API_KEY the browser's own voice is used.

import { createHmac, timingSafeEqual } from "node:crypto";

export const DEFAULT_VOICE = "zarina_en_conversation";
export const TTS_MODEL = "bulbul:v4-flash";
/** Sarvam allows 2,500 characters a request; an interviewer line is far shorter. */
export const MAX_TTS_CHARS = 600;

export type TtsSettings = { apiKey: string; voice: string };

/** The voice settings, or null when no key is set (the browser then reads aloud itself). */
export function ttsSettings(env: Record<string, string | undefined> = process.env): TtsSettings | null {
  const apiKey = env.SARVAM_API_KEY?.trim();
  if (!apiKey) return null;
  return { apiKey, voice: env.SARVAM_VOICE?.trim() || DEFAULT_VOICE };
}

/**
 * Text as Sarvam reads it best: one line, no symbols that are read out literally, and numbers over four
 * digits with commas (its docs ask for "10,000", not "10000"). Pure, for tests.
 */
export function speakable(text: string): string {
  return text
    .replace(/[`*_#>|[\]{}]/g, " ")
    .replace(/\b(\d{5,})\b/g, (n) => Number(n).toLocaleString("en-IN"))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TTS_CHARS);
}

/** The request body for one line. Pure, for tests. */
export function ttsBody(text: string, voice: string) {
  return {
    text: speakable(text),
    language_code: "en-IN",
    model: TTS_MODEL,
    speaker: voice,
    output_audio_codec: "mp3",
    speech_sample_rate: 24000,
    pace: 1.0,
  };
}

// ---- streaming (VI-8) -------------------------------------------------------
// Sarvam's HTTP stream sends the first audio in about half a second instead of about 2.5 seconds for the
// whole file. The browser plays it from a signed URL as it arrives: the server signs each line it wrote,
// so the voice route needs no database call and cannot be used to voice any other text.

export const SARVAM_STREAM_URL = "https://api.sarvam.ai/text-to-speech/stream";
/** How long a signed line can be played: one interview, with room for pauses. */
export const LINE_TTL_MS = 45 * 60 * 1000;

const b64url = (b: Buffer) => b.toString("base64url");

/** A token for one line: the text and its expiry, signed with the voice key. Node only. */
export function signLine(text: string, secret: string, now = Date.now()): string {
  const payload = b64url(Buffer.from(JSON.stringify({ t: speakable(text), e: now + LINE_TTL_MS })));
  const sig = b64url(createHmac("sha256", secret).update(payload).digest());
  return `${payload}.${sig}`;
}

/** The line a token carries, or null if it was not signed by us or has expired. Node only. */
export function verifyLine(token: string, secret: string, now = Date.now()): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret).update(payload).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const { t, e } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { t?: unknown; e?: unknown };
    return typeof t === "string" && typeof e === "number" && e > now && t ? t : null;
  } catch {
    return null;
  }
}

/** The URL the browser plays a line from, or null when the voice service is off (the browser speaks). */
export function lineUrl(text: string, settings: TtsSettings | null = ttsSettings()): string | null {
  return settings ? `/api/ai/voice/say?t=${signLine(text, settings.apiKey)}` : null;
}

/** Sarvam's streamed MP3 for one line, or null if it fails. */
export async function streamSpeech(text: string, settings: TtsSettings | null = ttsSettings()): Promise<Response | null> {
  if (!settings) return null;
  try {
    const res = await fetch(SARVAM_STREAM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-subscription-key": settings.apiKey },
      body: JSON.stringify(ttsBody(text, settings.voice)),
      signal: AbortSignal.timeout(20_000),
    });
    return res.ok && res.body ? res : null;
  } catch {
    return null;
  }
}
