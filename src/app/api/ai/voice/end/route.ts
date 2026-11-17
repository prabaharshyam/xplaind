// VI-10: "has the learner finished answering?" A tiny fast-model call made after a short pause, so a
// finished answer is sent in about 2 seconds while a thinking pause still gets 5 to 7. Its own allowance
// and its own per-minute limit, so these checks never use up the interview's follow-up turns.
import { json, problem } from "@/lib/account/http";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";
import { voiceAccess } from "@/lib/ai/voice-access";
import { VoiceEndRequest, finishedEnough, voiceEndPrompt } from "@/lib/ai/voice-interview";
import { getContent } from "@/lib/content";

export const maxDuration = 15;

export async function POST(request: Request) {
  const access = await voiceAccess();
  if (access instanceof Response) return access;
  const req = await body(request, VoiceEndRequest, 12_000);
  if (req instanceof Response) return req;
  const q = getContent().interview.find((x) => x.data.id === req.questionId)?.data;
  if (!q) return problem(400, "Unknown question.");
  const out = await runAi({
    kind: "voice_end",
    model: "fast",
    caller: access.who,
    ...voiceEndPrompt(q.question, req.asked, req.answer),
    maxTokens: 60,
    effort: "low",
    burst: 40,
    rateKey: "end",
  });
  // On any failure the browser simply keeps waiting for the longer pause.
  if (out instanceof Response) return json({ finished: false });
  return json({ finished: finishedEnough(out.data) });
}
