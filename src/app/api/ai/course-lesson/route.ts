// Write one lesson of a generated course (signed-in learners only, CO-1 caps apply).
import { json } from "@/lib/account/http";
import { cleanCourseLesson, CourseLessonRequest, courseLessonPrompt } from "@/lib/ai/features";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";

export const maxDuration = 120;

export async function POST(request: Request) {
  const req = await body(request, CourseLessonRequest);
  if (req instanceof Response) return req;
  const out = await runAi({ kind: "course-lesson", ...courseLessonPrompt(req), maxTokens: 12_000, effort: "medium" });
  if (out instanceof Response) return out;
  return json({ lesson: cleanCourseLesson(out.data) });
}
