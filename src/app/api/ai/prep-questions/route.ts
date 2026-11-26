// PREP-6: writes ten practice questions for a pasted job post, on the main model, for the learner's
// interview prep plan. Pro only, checked before anything is read. The job post is not stored: the
// questions go back to the browser, which keeps them on the device.
import { json, problem } from "@/lib/account/http";
import { cleanGenerated, PREP_PRO_ONLY, PrepQuestionsRequest, prepQuestionsPrompt } from "@/lib/ai/prep-questions";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";
import { voiceAccess } from "@/lib/ai/voice-access";

export const maxDuration = 60;

export async function POST(request: Request) {
  const access = await voiceAccess({ proOnly: PREP_PRO_ONLY });
  if (access instanceof Response) return access;
  const req = await body(request, PrepQuestionsRequest, 40_000);
  if (req instanceof Response) return req;
  // Counted as a job-description plan (voice_plan): the same kind of call, with the same daily limit.
  const out = await runAi({ kind: "voice_plan", model: "main", caller: access.who, ...prepQuestionsPrompt(req), maxTokens: 6000, effort: "low" });
  if (out instanceof Response) return out;
  const questions = cleanGenerated(out.data);
  if (!out.data.is_job_description || questions.length === 0) return problem(422, "That does not read like a job post. Paste the post or the job description and try again.");
  return json({ questions });
}
