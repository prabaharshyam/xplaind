// VI-11: plans an AI interview from a pasted job description, on the main model: the best-fitting bank
// questions plus one or two written for this job. The description is not stored; the plan goes back
// sealed, and the browser sends it with each later call.
import { json } from "@/lib/account/http";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";
import { buildPlan, VoicePlanRequest, voicePlanPrompt } from "@/lib/ai/interview-plan";
import { rolePaths, sealPlan } from "@/lib/ai/voice-plan-server";
import { voiceAccess } from "@/lib/ai/voice-access";
import { VOICE_BURST } from "@/lib/ai/voice-interview";
import { getInterviewViews } from "@/lib/content/interview";

export const maxDuration = 60;

export async function POST(request: Request) {
  const access = await voiceAccess();
  if (access instanceof Response) return access;
  const req = await body(request, VoicePlanRequest, 20_000);
  if (req instanceof Response) return req;
  const bank = getInterviewViews();
  const paths = rolePaths();
  const out = await runAi({
    kind: "voice_plan",
    model: "main",
    caller: access.who,
    ...voicePlanPrompt(req, bank, paths),
    maxTokens: 3000,
    effort: "low",
    burst: VOICE_BURST,
  });
  if (out instanceof Response) return out;
  const plan = buildPlan(out.data, req, bank, paths, Math.floor(Math.random() * 2 ** 31));
  const token = sealPlan(plan);
  const byId = new Map(bank.map((q) => [q.id, q.question]));
  return json({
    plan: token,
    looksLikeJd: out.data.is_job_description,
    role: plan.role,
    pathId: plan.pathId,
    focus: plan.focus,
    questions: plan.questionIds.map((id) => ({ id, question: byId.get(id) ?? plan.custom.find((c) => c.id === id)!.question, custom: id.startsWith("jd-") })),
  });
}
