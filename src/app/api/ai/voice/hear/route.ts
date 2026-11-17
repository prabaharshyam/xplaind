// VI-9: one piece of the learner's spoken answer (a few seconds of audio, cut at a natural pause) turned
// into text by Sarvam AI, with the question's terms as hints. The interview's signed token stands in for
// the Pro check made at the start, so there is no database call per piece. Audio is passed straight
// through and never stored.
import { problem, json } from "@/lib/account/http";
import { MAX_PIECE_BYTES, audioType, hearTokenValid, transcribe } from "@/lib/ai/stt";
import { ttsSettings } from "@/lib/ai/tts";
import { keytermsFor } from "@/lib/ai/voice-interview";
import { getContent } from "@/lib/content";

export const maxDuration = 30;

export async function POST(request: Request) {
  const settings = ttsSettings();
  if (!settings) return problem(503, "Speech-to-text is off.");
  const url = new URL(request.url);
  if (!hearTokenValid(url.searchParams.get("t") ?? "", settings)) return problem(403, "That interview has expired. Start it again.");
  const type = audioType(request.headers.get("content-type"));
  if (!type) return problem(415, "That is not an audio type we can read.");
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_PIECE_BYTES) return problem(413, "That piece of audio is too long.");
  const audio = await request.blob();
  if (audio.size === 0 || audio.size > MAX_PIECE_BYTES) return problem(413, "That piece of audio is too long.");
  const q = getContent().interview.find((x) => x.data.id === url.searchParams.get("q"))?.data;
  const text = await transcribe(audio, type, q ? keytermsFor(q) : [], settings);
  if (text === null) return problem(502, "We could not hear that clearly.");
  return json({ text });
}
