// AI learning companion on a lesson page (signed-in learners only, CO-1 caps apply).
import { json, problem } from "@/lib/account/http";
import { aiCatalog, lessonForTutor, lessonIds, withTitles } from "@/lib/ai/catalog";
import { cleanChat, TutorRequest, tutorPrompt } from "@/lib/ai/features";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";

export const maxDuration = 60;

export async function POST(request: Request) {
  const req = await body(request, TutorRequest);
  if (req instanceof Response) return req;
  const lesson = lessonForTutor(req.lessonId);
  if (!lesson) return problem(400, "Unknown lesson.");
  const out = await runAi({ kind: "tutor", ...tutorPrompt(lesson, req.turns, aiCatalog()), maxTokens: 4_000, effort: "low" });
  if (out instanceof Response) return out;
  return json(withTitles(cleanChat(out.data, lessonIds())));
}
