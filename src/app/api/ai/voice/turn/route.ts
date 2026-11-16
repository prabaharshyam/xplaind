// VI-1: one follow-up from the AI voice interviewer, on the fast model. Only the transcript text arrives
// here; audio never leaves the browser (VI-2). Nothing is stored.
import { json, problem } from "@/lib/account/http";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";
import { voiceAccess } from "@/lib/ai/voice-access";
import { VOICE_BURST, VoiceTurnRequest, bankFollowUp, cleanTurn, turnDecision, voiceTurnPrompt } from "@/lib/ai/voice-interview";
import { getContent } from "@/lib/content";

export const maxDuration = 60;

export async function POST(request: Request) {
  const access = await voiceAccess();
  if (access instanceof Response) return access;
  const req = await body(request, VoiceTurnRequest, 40_000);
  if (req instanceof Response) return req;
  const q = getContent().interview.find((x) => x.data.id === req.questionId)?.data;
  if (!q) return problem(400, "Unknown question.");
  // A skipped answer, or two follow-ups already: move on without a model call.
  if (turnDecision(req.exchanges) === "done") return json({ follow_up: null });

  const out = await runAi({ kind: "voice", model: "fast", ...voiceTurnPrompt(q, req.exchanges), maxTokens: 600, effort: "low", burst: VOICE_BURST });
  if (out instanceof Response) {
    // Limits, sign-in and Pro answers go back as they are. If the AI service itself failed, the interview
    // carries on with a follow-up from the question bank instead of stopping.
    if (out.status < 500 && out.status !== 422) return out;
    return json({ follow_up: req.exchanges.length === 1 ? bankFollowUp(q, req.exchanges) : null, fallback: true });
  }
  return json({ follow_up: cleanTurn(out.data, q, req.exchanges) });
}
