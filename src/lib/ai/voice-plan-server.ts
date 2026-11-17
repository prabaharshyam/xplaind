// VI-11: reading the interview setup on the server. The sealed plan is signed with the AI key, which every
// AI interviewer route already needs. Node only.
import { getContent, getPaths } from "@/lib/content";
import { asPlan, contextOf, findQuestion, PLAN_TTL_MS, type InterviewContext, type InterviewPlan, type InterviewSetup } from "./interview-plan";
import { seal, unseal } from "./seal";
import { aiSettings } from "./settings";
import type { VoiceQuestion } from "./voice-interview";

const secret = () => aiSettings()?.apiKey ?? null;

export const sealPlan = (plan: InterviewPlan): string | null => {
  const s = secret();
  return s ? seal(plan, s, PLAN_TTL_MS) : null;
};

export const openPlan = (token: string | undefined): InterviewPlan | null => {
  const s = secret();
  return token && s ? asPlan(unseal(token, s)) : null;
};

export const voiceBank = (): Map<string, VoiceQuestion> => new Map(getContent().interview.map((x) => [x.data.id, x.data]));

export const rolePaths = () => getPaths().map((p) => ({ id: p.id, name: p.name }));

/** The plan (or null), who the interview is for, and a lookup for its questions. */
export function interviewFrom(req: { setup?: InterviewSetup; plan?: string }): {
  plan: InterviewPlan | null;
  ctx: InterviewContext;
  find: (id: string) => VoiceQuestion | null;
  /** A plan was sent but is not ours or has expired. */
  expired: boolean;
} {
  const plan = openPlan(req.plan);
  const bank = voiceBank();
  return { plan, ctx: contextOf(plan, req.setup, rolePaths()), find: (id) => findQuestion(id, bank, plan), expired: !!req.plan && !plan };
}
