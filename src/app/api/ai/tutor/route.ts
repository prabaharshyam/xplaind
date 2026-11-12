// The AI tutor: in a lesson it is grounded in that lesson; on /ai/tutor it is general (CO-1 caps apply).
import { json, problem } from "@/lib/account/http";
import { aiCatalog, lessonForTutor, lessonIds, withTitles } from "@/lib/ai/catalog";
import { cleanChat, TutorRequest, tutorPrompt } from "@/lib/ai/features";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";
import { siteGuideText } from "@/lib/ai/site-guide";

export const maxDuration = 60;

export async function POST(request: Request) {
  const req = await body(request, TutorRequest);
  if (req instanceof Response) return req;
  const lesson = req.lessonId ? lessonForTutor(req.lessonId) : null;
  if (req.lessonId && !lesson) return problem(400, "Unknown lesson.");
  const out = await runAi({ kind: "tutor", ...tutorPrompt(lesson, req, aiCatalog(), lesson ? "" : siteGuideText()), maxTokens: 4_000, effort: "low" });
  if (out instanceof Response) return out;
  return json(withTitles(cleanChat(out.data, lessonIds())));
}
