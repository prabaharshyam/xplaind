// VI-1 and VI-8: the next follow-up from the AI voice interviewer, on the fast model. It comes back as
// text with a signed URL for its voice, so the browser starts playing it at once while it streams. The
// browser has already said a short "Okay" by then. Only the transcript text arrives here; audio never
// leaves the browser (VI-2). Nothing is stored.
import { json, problem } from "@/lib/account/http";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";
import { lineUrl } from "@/lib/ai/tts";
import { trialLeft, trialUsed, voiceAccess } from "@/lib/ai/voice-access";
import { VOICE_BURST, VoiceTurnRequest, asksForHelp, bankFollowUp, cleanTurn, followUpsAsked, languageRedirect, turnDecision, voiceTurnPrompt } from "@/lib/ai/voice-interview";
import { interviewFrom } from "@/lib/ai/voice-plan-server";

export const maxDuration = 60;

/**
 * VI-14 and VI-15: clarify marks a line that explains the question, redirect one that brings the candidate
 * back to English or to the interview. Neither is a follow-up, so none is used up.
 */
const reply = (followUp: string | null, clarify = false, redirect?: "language" | "topic") =>
  json(followUp ? { follow_up: followUp, audio: lineUrl(followUp), ...(clarify ? { clarify: true } : {}), ...(redirect ? { redirect } : {}) } : { follow_up: null });

export async function POST(request: Request) {
  const access = await voiceAccess();
  if (access instanceof Response) return access;
  const req = await body(request, VoiceTurnRequest, 40_000);
  if (req instanceof Response) return req;
  const { ctx, find } = interviewFrom(req);
  const q = find(req.questionId);
  if (!q) return problem(400, "Unknown question.");
  // VI-13: a follow-up mints a voice line, so a free account with its interview used gets none.
  if (access.trial && !(await trialLeft(access))) return trialUsed();
  // VI-15: an answer mostly in an Indian script gets the fixed "in English, please" line, with no model
  // call; once the redirects are used up, the interview moves on.
  const english = languageRedirect(q, req.exchanges);
  if (english !== undefined) return reply(english, false, english ? "language" : undefined);
  // A skipped answer, or two follow-ups already: move on without a model call.
  if (turnDecision(req.exchanges) === "done") return json({ follow_up: null });

  const out = await runAi({
    kind: "voice",
    model: "fast",
    caller: access.who,
    ...voiceTurnPrompt(q, req.exchanges, ctx, req.position),
    maxTokens: 300,
    effort: "low",
    burst: VOICE_BURST,
  });
  if (out instanceof Response) {
    // Limits, sign-in and Pro answers go back as they are. If the AI service itself failed, the interview
    // carries on with a follow-up from the question bank instead of stopping.
    // VI-13: in the free interview, a spent turn allowance moves on the same way, never an upgrade prompt mid-answer.
    if (out.status < 500 && out.status !== 422 && !(access.trial && out.status === 429)) return out;
    // VI-14: if they asked for help, at least ask the question again rather than moving on.
    const last = req.exchanges[req.exchanges.length - 1].answer;
    if (asksForHelp(last) && !req.exchanges.some((e) => e.clarify)) return reply(`Sure, let me ask it again. ${q.question}`, true);
    return reply(followUpsAsked(req.exchanges) === 0 ? bankFollowUp(q, req.exchanges) : null);
  }
  const next = cleanTurn(out.data, q, req.exchanges);
  return reply(next?.line ?? null, next?.clarify, next?.redirect);
}
