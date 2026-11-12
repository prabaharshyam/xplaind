// "Study from my notes & books": answers a question only from excerpts of the learner's own file (MB-8).
// Signed-in learners only, CO-1 caps apply, fast model. The question and excerpts are not stored.
import { json } from "@/lib/account/http";
import { BookAskRequest, bookAskPrompt, cleanBookAnswer, NOT_IN_NOTES } from "@/lib/ai/features";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";

export const maxDuration = 60;

export async function POST(request: Request) {
  const req = await body(request, BookAskRequest, 40_000); // up to 8 excerpts of about 1,200 characters
  if (req instanceof Response) return req;
  // Nothing in the file matched: say so without spending an AI call.
  if (req.excerpts.length === 0) return json({ found: false, answer: NOT_IN_NOTES, citations: [], followUps: [] });
  const out = await runAi({ kind: "notes", ...bookAskPrompt(req), maxTokens: 2_000, effort: "low" });
  if (out instanceof Response) return out;
  return json(cleanBookAnswer(out.data, req.excerpts));
}
