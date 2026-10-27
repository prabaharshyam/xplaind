// IQ-7: grade a typed or spoken interview answer (signed-in learners only, CO-1: 5 a day).
import { json, problem } from "@/lib/account/http";
import { cleanGrade, GradeRequest, gradePrompt } from "@/lib/ai/features";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";
import { getContent } from "@/lib/content";

export const maxDuration = 60;

export async function POST(request: Request) {
  const req = await body(request, GradeRequest);
  if (req instanceof Response) return req;
  const q = getContent().interview.find((x) => x.data.id === req.questionId)?.data;
  if (!q) return problem(400, "Unknown question.");
  const out = await runAi({ kind: "grade", ...gradePrompt(q, req.answer), maxTokens: 4_000, effort: "low" });
  if (out instanceof Response) return out;
  return json({ grade: cleanGrade(out.data, q.rubric) });
}
