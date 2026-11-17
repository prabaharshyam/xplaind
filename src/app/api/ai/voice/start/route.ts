// VI-8: starts an AI voice interview. Checks access once (spends nothing), then returns every line the
// interviewer will say that is known in advance (each question with its lead-in, the short reactions and
// the closing line), each with a signed URL for its voice, so the browser can fetch them ahead of time.
import { json, problem } from "@/lib/account/http";
import { body } from "@/lib/ai/route";
import { hearToken } from "@/lib/ai/stt";
import { lineUrl, ttsSettings } from "@/lib/ai/tts";
import { voiceAccess } from "@/lib/ai/voice-access";
import { ACK_LINES, CLOSING_LINE, MAX_VOICE_QUESTIONS, questionLine } from "@/lib/ai/voice-interview";
import { SetupFields } from "@/lib/ai/interview-plan";
import { interviewFrom } from "@/lib/ai/voice-plan-server";
import { z } from "zod";

const StartRequest = z.strictObject({ questionIds: z.array(z.string().min(1).max(80)).min(1).max(MAX_VOICE_QUESTIONS), ...SetupFields });

export async function POST(request: Request) {
  const access = await voiceAccess();
  if (access instanceof Response) return access;
  const req = await body(request, StartRequest, 30_000);
  if (req instanceof Response) return req;
  // VI-11: questions come from the bank or, for a job description, from the sealed plan.
  const { ctx, find, expired } = interviewFrom(req);
  if (expired) return problem(400, "That interview plan has expired. Set it up again.");
  const asked = req.questionIds.map(find);
  if (asked.some((q) => !q)) return problem(400, "Unknown question.");
  const tts = ttsSettings();
  const line = (text: string) => ({ text, audio: lineUrl(text, tts) });
  return json({
    questions: asked.map((q, i) => line(questionLine(i, asked.length, q!.question, ctx))),
    acks: ACK_LINES.map(line),
    closing: line(CLOSING_LINE),
    // VI-9: with Sarvam on, answers are transcribed by Sarvam (pieces posted with this token).
    hear: hearToken(tts),
  });
}
