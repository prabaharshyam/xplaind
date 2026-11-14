// IQ-7 for a whole mock interview: every answer graded against its reference in one
// call (signed-in learners only, CO-1: 3 reviews a day).
// IR-1: a reviewed interview for a role keeps its score, and the answer returns the role's readiness.
// IR-2 (ask at the moment of value): without Pro, each answer keeps its score and verdict; what was
// right, the mistakes, the missing points and a stronger answer are for Pro, and are not sent.
import { json, problem } from "@/lib/account/http";
import { cleanInterviewReview, freeView, InterviewReviewRequest, interviewReviewPrompt } from "@/lib/ai/features";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";
import { proOpen } from "@/lib/billing/config";
import { getContent, getPaths } from "@/lib/content";
import { readiness, sessionScore } from "@/lib/interview/readiness";
import { currentUser, serviceClient, userClient } from "@/lib/supabase/server";

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
  const review = cleanInterviewReview(out.data, known.map((x) => x.q));

  // IR-1: keep this interview's score for the role, then read the role's readiness back.
  let ready = null;
  const pathId = req.pathId && getPaths().some((p) => p.id === req.pathId) ? req.pathId : "any";
  const score = sessionScore(review.answers.map((a) => a.score));
  const client = await userClient();
  const user = client ? await currentUser(client) : null;
  const admin = serviceClient();
  if (user && admin && score !== null) {
    await admin.from("interview_readiness").insert({ user_id: user.id, path_id: pathId, score, answered: review.answers.length });
    const { data } = await admin.from("interview_readiness").select("score").eq("user_id", user.id).eq("path_id", pathId).order("taken_at", { ascending: false }).limit(6);
    ready = readiness((data ?? []).map((r) => r.score as number));
  }

  const locked = proOpen() && out.tier !== "pro";
  return json({ review: locked ? freeView(review) : review, locked, readiness: ready, pathId });
}
