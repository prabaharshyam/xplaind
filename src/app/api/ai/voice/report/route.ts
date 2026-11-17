// VI-4: the scored report for an AI voice interview, on the main model. Only the score summary is kept
// (one interview_readiness row: the score out of 100, how many questions were answered, the role), never
// the transcript, so the role's readiness (IR-1) counts voice interviews too.
import { json, problem } from "@/lib/account/http";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";
import { voiceAccess } from "@/lib/ai/voice-access";
import { VOICE_BURST, VoiceReportRequest, buildVoiceReport, voiceReportPrompt, type AskedItem } from "@/lib/ai/voice-interview";
import { getContent, getPaths } from "@/lib/content";
import { readiness } from "@/lib/interview/readiness";
import { currentUser, userClient } from "@/lib/supabase/server";

export const maxDuration = 120;

export async function POST(request: Request) {
  const access = await voiceAccess();
  if (access instanceof Response) return access;
  const req = await body(request, VoiceReportRequest, 120_000);
  if (req instanceof Response) return req;
  const bank = new Map(getContent().interview.map((x) => [x.data.id, x.data]));
  const items = req.items.map((it) => ({ q: bank.get(it.questionId), exchanges: it.exchanges }));
  if (items.some((x) => !x.q)) return problem(400, "Unknown question.");
  const asked = items as AskedItem[];
  if (!asked.some((it) => it.exchanges.some((e) => e.answer.trim()))) return problem(400, "Answer at least one question to get a report.");

  const out = await runAi({ kind: "voice", model: "main", caller: access.who, ...voiceReportPrompt(asked), maxTokens: 12_000, effort: "low", burst: VOICE_BURST });
  if (out instanceof Response) return out;
  const report = buildVoiceReport(out.data, asked);

  let ready = null;
  const pathId = req.pathId && getPaths().some((p) => p.id === req.pathId) ? req.pathId : "any";
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
  return json({ report, readiness: ready, pathId });
}
