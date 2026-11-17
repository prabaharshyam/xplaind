// VI-6: the interviewer's own lines in its natural voice: each bank question with its lead-in, and the
// closing line. The text is built here from the question bank, never taken from the browser, so this
// cannot be used to voice anything else. Returns MP3 audio, or 204 when the voice service is off or
// fails (the browser then reads the line itself).
import { json, problem, rateLimit } from "@/lib/account/http";
import { body } from "@/lib/ai/route";
import { synthesize } from "@/lib/ai/tts";
import { voiceAccess } from "@/lib/ai/voice-access";
import { CLOSING_LINE, MAX_VOICE_QUESTIONS, questionLine } from "@/lib/ai/voice-interview";
import { getContent } from "@/lib/content";
import { z } from "zod";

export const maxDuration = 30;

const SpeakRequest = z.union([
  z.strictObject({
    line: z.literal("question"),
    questionId: z.string().min(1).max(80),
    index: z.number().int().min(0).max(MAX_VOICE_QUESTIONS - 1),
    total: z.number().int().min(1).max(MAX_VOICE_QUESTIONS),
  }),
  z.strictObject({ line: z.literal("closing") }),
]);

export async function POST(request: Request) {
  const access = await voiceAccess();
  if (access instanceof Response) return access;
  // About 7 lines per interview; 30 a minute leaves room for replays and prefetching.
  const limited = await rateLimit(access.admin, `tts:${access.who.id}`, 60, 30);
  if (limited) return limited;
  const req = await body(request, SpeakRequest, 2_000);
  if (req instanceof Response) return req;

  let text = CLOSING_LINE;
  if (req.line === "question") {
    const q = getContent().interview.find((x) => x.data.id === req.questionId)?.data;
    if (!q || req.index >= req.total) return problem(400, "Unknown question.");
    text = questionLine(req.index, req.total, q.question);
  }
  const audio = await synthesize(text);
  if (!audio) return new Response(null, { status: 204, headers: { "x-say": encodeURIComponent(text) } });
  return new Response(new Uint8Array(audio), {
    status: 200,
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=3600", "x-say": encodeURIComponent(text) },
  });
}

export const GET = () => json({ error: "Use POST." }, 405);
