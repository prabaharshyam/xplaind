// VI-1: one follow-up from the AI voice interviewer, on the fast model, with a short natural reaction
// before it. VI-6: the line comes back as audio in the interviewer's voice too, so the browser can play
// it at once. Only the transcript text arrives here; audio never leaves the browser (VI-2). Nothing is stored.
import { json, problem } from "@/lib/account/http";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";
import { synthesize } from "@/lib/ai/tts";
import { voiceAccess } from "@/lib/ai/voice-access";
import { VOICE_BURST, VoiceTurnRequest, bankFollowUp, cleanTurn, followUpLine, turnDecision, voiceTurnPrompt } from "@/lib/ai/voice-interview";
import { getContent } from "@/lib/content";

export const maxDuration = 60;

/** The follow-up as text, the full spoken line, and its audio (base64 MP3, or null to use the browser's voice). */
async function reply(followUp: string | null, ack: string) {
  if (!followUp) return json({ follow_up: null });
  const say = followUpLine(ack, followUp);
  const audio = await synthesize(say);
  return json({ follow_up: followUp, say, audio: audio ? audio.toString("base64") : null });
}

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
    return reply(req.exchanges.length === 1 ? bankFollowUp(q, req.exchanges) : null, "Okay.");
  }
  return reply(cleanTurn(out.data, q, req.exchanges), out.data.ack);
}
