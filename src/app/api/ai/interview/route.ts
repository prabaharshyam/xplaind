// IQ-7 for a whole mock interview: every answer graded against its reference in one
// call (signed-in learners only, CO-1: 3 reviews a day).
import { json, problem } from "@/lib/account/http";
import { cleanInterviewReview, InterviewReviewRequest, interviewReviewPrompt } from "@/lib/ai/features";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";
import { getContent } from "@/lib/content";

export const maxDuration = 120;

export async function POST(request: Request) {
  const req = await body(request, InterviewReviewRequest);
  if (req instanceof Response) return req;
  const bank = new Map(getContent().interview.map((x) => [x.data.id, x.data]));
  const items = req.answers.map((a) => ({ q: bank.get(a.questionId), answer: a.answer }));
  if (items.some((x) => !x.q)) return problem(400, "Unknown question.");
  const known = items as { q: NonNullable<(typeof items)[number]["q"]>; answer: string }[];
  const out = await runAi({ kind: "interview", ...interviewReviewPrompt(known), maxTokens: 16_000, effort: "low" });
  if (out instanceof Response) return out;
  return json({ review: cleanInterviewReview(out.data, known.map((x) => x.q)) });
}
