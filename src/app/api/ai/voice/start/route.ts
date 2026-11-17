// VI-8: starts an AI voice interview. Checks access once (spends nothing), then returns every line the
// interviewer will say that is known in advance (each question with its lead-in, the short reactions and
// the closing line), each with a signed URL for its voice, so the browser can fetch them ahead of time.
import { json, problem } from "@/lib/account/http";
import { body } from "@/lib/ai/route";
import { lineUrl, ttsSettings } from "@/lib/ai/tts";
import { voiceAccess } from "@/lib/ai/voice-access";
import { ACK_LINES, CLOSING_LINE, MAX_VOICE_QUESTIONS, questionLine } from "@/lib/ai/voice-interview";
import { getContent } from "@/lib/content";
import { z } from "zod";

const StartRequest = z.strictObject({ questionIds: z.array(z.string().min(1).max(80)).min(1).max(MAX_VOICE_QUESTIONS) });

export async function POST(request: Request) {
  const access = await voiceAccess();
  if (access instanceof Response) return access;
  const req = await body(request, StartRequest, 4_000);
  if (req instanceof Response) return req;
  const bank = new Map(getContent().interview.map((x) => [x.data.id, x.data]));
  if (req.questionIds.some((id) => !bank.has(id))) return problem(400, "Unknown question.");
  const tts = ttsSettings();
  const line = (text: string) => ({ text, audio: lineUrl(text, tts) });
  return json({
    questions: req.questionIds.map((id, i) => line(questionLine(i, req.questionIds.length, bank.get(id)!.question))),
    acks: ACK_LINES.map(line),
    closing: line(CLOSING_LINE),
  });
}
