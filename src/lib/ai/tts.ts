// VI-6 (2026-11-17, owner request): the AI interviewer speaks in a natural Indian English voice from
// Sarvam AI (Bulbul v4 Flash, voice "zarina_en_conversation", chosen by the owner from six samples).
// Only the interviewer's own lines are sent, and every line is written on our server (bank questions,
// fixed lead-ins, the model's follow-ups), so the browser cannot use this to voice any text it likes.
// The learner's voice never goes here (VI-2). Without SARVAM_API_KEY the browser's own voice is used.

export const SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech";
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

/** One line as MP3 audio, or null if the voice service is off or fails (the browser then speaks instead). */
export async function synthesize(text: string, settings: TtsSettings | null = ttsSettings()): Promise<Buffer | null> {
  if (!settings || !speakable(text)) return null;
  try {
    const res = await fetch(SARVAM_TTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-subscription-key": settings.apiKey },
      body: JSON.stringify(ttsBody(text, settings.voice)),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { audios?: string[] };
    const audio = data.audios?.[0];
    return audio ? Buffer.from(audio, "base64") : null;
  } catch {
    return null;
  }
}
