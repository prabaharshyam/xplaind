// Personal AI coach chat (signed-in learners only, CO-1 caps apply).
import { json } from "@/lib/account/http";
import { aiCatalog, lessonIds, withTitles } from "@/lib/ai/catalog";
import { CoachRequest, coachPrompt, cleanChat } from "@/lib/ai/features";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";

export const maxDuration = 60;

export async function POST(request: Request) {
  const req = await body(request, CoachRequest);
  if (req instanceof Response) return req;
  const out = await runAi({ kind: "coach", ...coachPrompt(req, aiCatalog()), maxTokens: 4_000, effort: "low" });
  if (out instanceof Response) return out;
  return json(withTitles(cleanChat(out.data, lessonIds())));
}
