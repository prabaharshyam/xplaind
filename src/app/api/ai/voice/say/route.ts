// VI-8: one interviewer line in its natural voice, streamed from Sarvam AI as it is made (the first sound
// arrives in about half a second). The line must carry our signature, so only lines our server wrote for a
// Pro interview can be voiced; that also means no database call here, which keeps it fast.
import { connection } from "next/server";
import { problem } from "@/lib/account/http";
import { streamSpeech, ttsSettings, verifyLine } from "@/lib/ai/tts";

export const maxDuration = 30;

export async function GET(request: Request) {
  await connection(); // every request is different: never prerendered at build time
  const settings = ttsSettings();
  // Voice off or Sarvam down: the browser's audio fails and it reads the line with its own voice.
  if (!settings) return problem(503, "The interviewer's voice is off.");
  const token = new URL(request.url).searchParams.get("t") ?? "";
  const text = token.length <= 2_000 ? verifyLine(token, settings.apiKey) : null;
  if (!text) return problem(403, "That line has expired. Start the interview again.");
  const voice = await streamSpeech(text, settings);
  if (!voice?.body) return problem(503, "The interviewer's voice is not available right now.");
  return new Response(voice.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=2700", "X-Content-Type-Options": "nosniff" },
  });
}
