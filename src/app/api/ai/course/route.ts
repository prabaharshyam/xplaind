// Generate a course outline on any topic (signed-in learners only, CO-1 caps apply).
import { json } from "@/lib/account/http";
import { cleanOutline, CourseRequest, coursePrompt } from "@/lib/ai/features";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";

export const maxDuration = 90;

export async function POST(request: Request) {
  const req = await body(request, CourseRequest);
  if (req instanceof Response) return req;
  const out = await runAi({ kind: "course", ...coursePrompt(req), maxTokens: 8_000, effort: "medium" });
  if (out instanceof Response) return out;
  return json({ outline: cleanOutline(out.data) });
}
