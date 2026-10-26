// "Ask me from my book": writes a test from excerpts of the learner's own book (MB-2).
// Signed-in learners only, CO-1 caps apply. The excerpts are not stored.
import { json, problem } from "@/lib/account/http";
import { BookRequest, bookPrompt, cleanBookQuestions } from "@/lib/ai/features";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";

export const maxDuration = 120;

export async function POST(request: Request) {
  const req = await body(request, BookRequest, 100_000); // up to 30 excerpts of about 1,200 characters
  if (req instanceof Response) return req;
  const out = await runAi({ kind: "book", ...bookPrompt(req), maxTokens: 12_000, effort: "medium" });
  if (out instanceof Response) return out;
  const questions = cleanBookQuestions(out.data, req.excerpts, req.count);
  if (questions.length === 0) return problem(422, "We could not write questions we could check against your book. Try other chapters, or a PDF with selectable text.");
  return json({ questions });
}
