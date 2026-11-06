// "Study from my notes & books": flashcards from excerpts of the learner's own file (MB-5).
// Same guards and daily cap as a test (MB-2, CO-1). The excerpts are not stored.
import { json, problem } from "@/lib/account/http";
import { BookCardsRequest, bookCardsPrompt, cleanBookCards } from "@/lib/ai/features";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";

export const maxDuration = 120;

export async function POST(request: Request) {
  const req = await body(request, BookCardsRequest, 100_000);
  if (req instanceof Response) return req;
  const out = await runAi({ kind: "book", ...bookCardsPrompt(req), maxTokens: 10_000, effort: "medium" });
  if (out instanceof Response) return out;
  const cards = cleanBookCards(out.data, req.excerpts, req.count);
  if (cards.length === 0) return problem(422, "We could not make cards we could check against your file. Try other chapters, or a PDF with selectable text.");
  return json({ cards });
}
