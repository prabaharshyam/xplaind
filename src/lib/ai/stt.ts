// VI-9 (2026-11-17, owner decision): the learner's spoken answer is turned into text by Sarvam AI
// (Saaras v4, trained on Indian English), not the phone's built-in recogniser, which misheard Indian
// accents and AI terms and wrote down every "um". The browser records short pieces of audio at natural
// pauses and posts each here; we send it to Sarvam with the question's terms as hints and return the
// text. Xplaind never stores the audio. Node only.
import { type TtsSettings, signLine, verifyLine } from "./tts";

export const SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text";
export const STT_MODEL = "saaras:v4";
/** Sarvam's REST limit is 30 seconds; the browser cuts pieces at 25. About 1 MB of compressed audio. */
export const MAX_PIECE_BYTES = 2_000_000;
export const AUDIO_TYPES = ["audio/webm", "audio/mp4", "audio/ogg", "audio/mpeg", "audio/wav", "audio/aac", "audio/x-m4a"];

const HEAR = "hear";

/** A token that lets this interview send audio for transcription, without a database call per piece. */
export const hearToken = (settings: TtsSettings | null): string | null => (settings ? signLine(HEAR, settings.apiKey) : null);
export const hearTokenValid = (token: string, settings: TtsSettings): boolean => verifyLine(token, settings.apiKey) === HEAR;

/** The plain media type of a piece of audio, if it is one Sarvam reads. Pure, for tests. */
export function audioType(contentType: string | null): string | null {
  const base = (contentType ?? "").split(";")[0].trim().toLowerCase();
  return AUDIO_TYPES.includes(base) ? base : null;
}

/** The form Sarvam's REST speech-to-text expects. Pure, for tests. */
export function sttForm(audio: Blob, type: string, keyterms: readonly string[]): FormData {
  const form = new FormData();
  const ext = type.split("/")[1].replace("x-m4a", "m4a").replace("mpeg", "mp3");
  form.append("file", audio, `answer.${ext}`);
  form.append("model", STT_MODEL);
  form.append("language_code", "en-IN");
  // Sarvam takes the hint terms as one JSON array (checked against the API, 17 Nov 2026).
  if (keyterms.length) form.append("keyterms", JSON.stringify(keyterms));
  return form;
}

/** The text of one piece of the learner's answer, or null if Sarvam could not read it. */
export async function transcribe(audio: Blob, type: string, keyterms: readonly string[], settings: TtsSettings): Promise<string | null> {
  try {
    const res = await fetch(SARVAM_STT_URL, {
      method: "POST",
      headers: { "api-subscription-key": settings.apiKey },
      body: sttForm(audio, type, keyterms),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { transcript?: unknown };
    return typeof data.transcript === "string" ? data.transcript.replace(/\s+/g, " ").trim() : null;
  } catch {
    return null;
  }
}
