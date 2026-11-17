// VI-4: the scored report for an AI voice interview, on the main model. Only the score summary is kept
// (one interview_readiness row: the score out of 100, how many questions were answered, the role), never
// the transcript, so the role's readiness (IR-1) counts voice interviews too.
import { json, problem } from "@/lib/account/http";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";
import { trialLeft, trialUsed, voiceAccess } from "@/lib/ai/voice-access";
import { TRIAL_QUESTIONS, VOICE_BURST, VoiceReportRequest, buildVoiceReport, voiceReportPrompt, type AskedItem } from "@/lib/ai/voice-interview";
import { getPaths } from "@/lib/content";
import { interviewFrom } from "@/lib/ai/voice-plan-server";
import { readiness } from "@/lib/interview/readiness";
import { currentUser, userClient } from "@/lib/supabase/server";

export const maxDuration = 120;

export async function POST(request: Request) {
  const access = await voiceAccess();
  if (access instanceof Response) return access;
  const req = await body(request, VoiceReportRequest, 120_000);
  if (req instanceof Response) return req;
  const { plan, ctx, find } = interviewFrom(req);
  const items = req.items.map((it) => ({ q: find(it.questionId), exchanges: it.exchanges }));
  if (items.some((x) => !x.q)) return problem(400, "Unknown question.");
  const asked = items as AskedItem[];
  if (!asked.some((it) => it.exchanges.some((e) => e.answer.trim()))) return problem(400, "Answer at least one question to get a report.");

  // VI-13: the free interview's report is its own allowance (one), so turns used on an abandoned try never
  // take it away.
  if (access.trial) {
    if (req.items.length > TRIAL_QUESTIONS || plan) return problem(400, `The free AI interview has ${TRIAL_QUESTIONS} questions.`);
    if (!(await trialLeft(access))) return trialUsed();
  }
  const out = await runAi({ kind: access.trial ? "voice_trial" : "voice", model: "main", caller: access.who, ...voiceReportPrompt(asked, ctx), maxTokens: 12_000, effort: "low", burst: VOICE_BURST });
  if (out instanceof Response) return out;
  const report = buildVoiceReport(out.data, asked);

  let ready = null;
  const wanted = plan?.pathId ?? req.setup?.pathId ?? req.pathId;
  const pathId = wanted && getPaths().some((p) => p.id === wanted) ? wanted : "any";
  const client = await userClient();
  const user = client ? await currentUser(client) : null;
  if (user && report.answered > 0) {
    await access.admin.from("interview_readiness").insert({ user_id: user.id, path_id: pathId, score: report.score, answered: report.answered });
    const { data } = await access.admin
      .from("interview_readiness")
      .select("score")
      .eq("user_id", user.id)
      .eq("path_id", pathId)
      .order("taken_at", { ascending: false })
      .limit(6);
    ready = readiness((data ?? []).map((r) => r.score as number));
  }
  return json({ report, readiness: ready, pathId, trial: access.trial });
}
