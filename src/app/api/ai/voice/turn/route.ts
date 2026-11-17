// VI-1 and VI-8: the next follow-up from the AI voice interviewer, on the fast model. It comes back as
// text with a signed URL for its voice, so the browser starts playing it at once while it streams. The
// browser has already said a short "Okay" by then. Only the transcript text arrives here; audio never
// leaves the browser (VI-2). Nothing is stored.
import { json, problem } from "@/lib/account/http";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";
import { lineUrl } from "@/lib/ai/tts";
import { voiceAccess } from "@/lib/ai/voice-access";
import { VOICE_BURST, VoiceTurnRequest, bankFollowUp, cleanTurn, turnDecision, voiceTurnPrompt } from "@/lib/ai/voice-interview";
import { interviewFrom } from "@/lib/ai/voice-plan-server";

export const maxDuration = 60;

const reply = (followUp: string | null) => json(followUp ? { follow_up: followUp, audio: lineUrl(followUp) } : { follow_up: null });

export async function POST(request: Request) {
  const access = await voiceAccess();
  if (access instanceof Response) return access;
  const req = await body(request, VoiceTurnRequest, 40_000);
  if (req instanceof Response) return req;
  const { ctx, find } = interviewFrom(req);
  const q = find(req.questionId);
  if (!q) return problem(400, "Unknown question.");
  // A skipped answer, or two follow-ups already: move on without a model call.
  if (turnDecision(req.exchanges) === "done") return json({ follow_up: null });

  const out = await runAi({
    kind: "voice",
    model: "fast",
    caller: access.who,
    ...voiceTurnPrompt(q, req.exchanges, ctx),
    maxTokens: 300,
    effort: "low",
    burst: VOICE_BURST,
  });
  if (out instanceof Response) {
    // Limits, sign-in and Pro answers go back as they are. If the AI service itself failed, the interview
    // carries on with a follow-up from the question bank instead of stopping.
    // VI-13: in the free interview, a spent turn allowance moves on the same way, never an upgrade prompt mid-answer.
    if (out.status < 500 && out.status !== 422 && !(access.trial && out.status === 429)) return out;
    return reply(req.exchanges.length === 1 ? bankFollowUp(q, req.exchanges) : null);
  }
  return reply(cleanTurn(out.data, q, req.exchanges));
}
