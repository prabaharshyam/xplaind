// "Study from my notes & books": study notes from excerpts of the learner's own file (MB-15). Same guards and daily
// allowance as a test or a deck (MB-2, CO-1). The excerpts are not stored.
import { json, problem } from "@/lib/account/http";
import { BookNotesRequest, bookNotesPrompt, cleanBookNotes } from "@/lib/ai/features";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";

export const maxDuration = 120;

export async function POST(request: Request) {
  const req = await body(request, BookNotesRequest, 100_000);
  if (req instanceof Response) return req;
  const out = await runAi({ kind: "book", ...bookNotesPrompt(req), maxTokens: 8_000, effort: "medium" });
  if (out instanceof Response) return out;
  const sections = cleanBookNotes(out.data, req.excerpts);
  if (sections.length === 0) return problem(422, "We could not write notes we could check against your file. Try other chapters, or a PDF with selectable text.");
  return json({ sections });
}
