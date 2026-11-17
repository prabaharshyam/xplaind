// VI-11 (2026-11-17, owner request): the AI interviewer set up for a real job. The learner either picks a
// role and their experience, or pastes a job description. From a job description the main model picks the
// best-fitting questions from our reviewed bank and writes one or two new ones the bank does not cover
// (owner's choice: a blend, so most key points stay reviewed). Nothing the learner typed is stored: the
// plan goes back to the browser sealed (lib/ai/seal), and each later call sends it back.
// Pure: no network, no database. The job description and company are data, never instructions (SC-5).
import { z } from "zod";
import { EXPERIENCE, EXPERIENCE_IDS, experienceOf, pickForSetup, type ExperienceId, type Pickable } from "@/lib/interview/setup";
import { asData, DATA_RULE } from "./prompt";
import type { VoiceQuestion } from "./voice-interview";

export const MIN_JD_CHARS = 150;
export const MAX_JD_CHARS = 8000;
const MAX_COMPANY_CHARS = 60;
const MAX_ROLE_CHARS = 60;
/** A sealed plan lasts as long as an interview can. */
export const PLAN_TTL_MS = 3 * 60 * 60 * 1000;
/** New questions written for the job: one in a 3-question interview, two in a 5-question one. */
export const customCount = (count: number) => (count >= 5 ? 2 : 1);

const Company = z.string().trim().max(MAX_COMPANY_CHARS);

/** What the browser sends with every call when no job description was used. */
export const InterviewSetup = z.strictObject({
  pathId: z.string().max(60).optional(),
  experience: z.enum(EXPERIENCE_IDS).optional(),
  company: Company.optional(),
});
export type InterviewSetup = z.infer<typeof InterviewSetup>;

/** The fields the AI routes accept on top of their own: the setup, and the sealed plan when there is one. */
export const SetupFields = { setup: InterviewSetup.optional(), plan: z.string().max(20_000).optional() };

export const VoicePlanRequest = z.strictObject({
  jd: z.string().trim().min(MIN_JD_CHARS, "Paste a little more of the job description.").max(MAX_JD_CHARS),
  company: Company.optional(),
  /** Left out: read from the job description. */
  experience: z.enum(EXPERIENCE_IDS).optional(),
  count: z.union([z.literal(3), z.literal(5)]),
});
export type VoicePlanRequest = z.infer<typeof VoicePlanRequest>;

/** A question written for this job. Ids are "jd-1" and "jd-2", never a bank id. */
export type CustomQuestion = VoiceQuestion & { id: `jd-${number}` };

/** What the sealed plan carries. */
export type InterviewPlan = {
  role: string;
  pathId: string | null;
  experience: ExperienceId;
  company: string;
  focus: string[];
  questionIds: string[];
  custom: CustomQuestion[];
};

/** Who the interview is for, as the prompts need it. */
export type InterviewContext = { role: string; experience: ExperienceId | null; company: string; focus: string[] };

export const isCustomId = (id: string) => /^jd-\d$/.test(id);

const oneLine = (s: unknown, n: number) =>
  String(s ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, n);

// ------------------------------------------------------------------ plan --

export const VoicePlanOutput = z.object({
  is_job_description: z.boolean(),
  role_title: z.string(),
  path_id: z.string(),
  experience: z.string(),
  focus: z.array(z.string()),
  picks: z.array(z.string()),
  custom: z.array(z.object({ question: z.string(), points: z.array(z.string()), model_answer: z.string(), follow_ups: z.array(z.string()) })),
});
export type VoicePlanOutput = z.infer<typeof VoicePlanOutput>;

export function voicePlanPrompt(req: VoicePlanRequest, bank: readonly Pickable[], paths: readonly { id: string; name: string }[]) {
  const exp = experienceOf(req.experience);
  const level = exp ? exp.short : "the experience the description asks for";
  const n = customCount(req.count);
  const system = [
    "You plan a spoken mock interview for Xplaind, an AI career site for learners in India, from a job description the learner pasted.",
    DATA_RULE,
    `is_job_description: false if the text is clearly not a job description or job post; still return a reasonable plan for an AI role then.`,
    `role_title: the job title from the description, at most ${MAX_ROLE_CHARS} characters, plain words.`,
    `path_id: the closest of these roles by id, or an empty string if none is close:\n${paths.map((p) => `- ${p.id}: ${p.name}`).join("\n")}`,
    `experience: ${exp ? `"${exp.id}"` : `the experience the description asks for, one of ${EXPERIENCE.map((e) => `"${e.id}" (${e.label})`).join(", ")}; "junior" if it does not say`}.`,
    "focus: the 3 to 6 skills or responsibilities the description stresses most, each a short name (2 to 5 words).",
    `picks: exactly ${req.count - n} question ids from the bank list, the ones that best test the focus skills for a candidate with ${level}. Use only ids from the list, each once, covering different skills.`,
    `custom: exactly ${n} new question${n === 1 ? "" : "s"} this job clearly needs and the bank does not cover (a tool, domain or duty named in the description). Each: question, one spoken question of at most 35 words, pitched for ${level}; points, 3 to 5 key points a strong answer covers, each under 140 characters; model_answer, 80 to 140 words, a strong spoken answer; follow_ups, 2 short follow-up questions.`,
    "Never ask about age, religion, caste, marriage, health, salary or anything personal. Plain, professional English.",
  ].join("\n\n");
  const list = bank.map((q) => `${q.id} | ${q.level} | ${q.topic} | ${q.kind ?? "concept"} | ${q.question}`).join("\n");
  const content = [
    exp ? `Experience the role asks for: ${exp.label}.` : "Experience: read it from the job description.",
    req.company ? `Company: ${asData("company", req.company, MAX_COMPANY_CHARS)}` : "",
    `Job description:\n${asData("job_description", req.jd, MAX_JD_CHARS)}`,
    `Question bank (id | level | topic | kind | question):\n${list}`,
    "Plan the interview.",
  ]
    .filter(Boolean)
    .join("\n\n");
  return { system, messages: [{ role: "user" as const, content }], schema: VoicePlanOutput };
}

/**
 * The plan to use: the model's picks that really are bank ids, topped up from the bank for the role and
 * experience if it gave too few, and its new questions cleaned and capped. A bank question comes first (a
 * calmer start), then new and bank questions alternate. Pure, for tests.
 */
export function buildPlan(
  out: VoicePlanOutput,
  req: VoicePlanRequest,
  bank: readonly Pickable[],
  paths: readonly { id: string; name: string }[],
  seed: number,
): InterviewPlan {
  const pathId = paths.some((p) => p.id === out.path_id) ? out.path_id : null;
  const experience: ExperienceId = req.experience ?? experienceOf(out.experience)?.id ?? "junior";
  const custom: CustomQuestion[] = out.custom
    .map((c) => ({
      question: oneLine(c.question, 300),
      points: c.points.map((p) => oneLine(p, 140)).filter((p) => p.length >= 8).slice(0, 5),
      answer: oneLine(c.model_answer, 1500),
      follow_ups: c.follow_ups.map((f) => oneLine(f, 300)).filter((f) => f.length >= 8).slice(0, 2),
    }))
    .filter((c) => c.question.length >= 15 && c.points.length >= 3 && c.answer.length >= 40)
    .slice(0, customCount(req.count))
    .map((c, i) => ({
      id: `jd-${i + 1}` as const,
      question: c.question,
      short_answer: c.answer,
      deeper_answer: c.answer,
      follow_ups: c.follow_ups,
      rubric: c.points.map((point) => ({ point })),
    }));
  const known = new Set(bank.map((q) => q.id));
  const picks = [...new Set(out.picks.filter((id) => known.has(id)))].slice(0, req.count - custom.length);
  if (picks.length < req.count - custom.length) {
    const more = pickForSetup(bank, { pathId, experience, style: "mixed", count: req.count - custom.length - picks.length, seed, exclude: picks });
    picks.push(...more.map((q) => q.id));
  }
  const order: string[] = [];
  const queue = [...custom.map((c) => c.id)];
  for (const id of picks) {
    order.push(id);
    const next = queue.shift();
    if (next) order.push(next);
  }
  order.push(...queue);
  return {
    role: oneLine(out.role_title, MAX_ROLE_CHARS) || (pathId ? paths.find((p) => p.id === pathId)!.name : "AI role"),
    pathId,
    experience,
    company: oneLine(req.company, MAX_COMPANY_CHARS),
    focus: out.focus.map((f) => oneLine(f, 60)).filter(Boolean).slice(0, 6),
    questionIds: order,
    custom,
  };
}

/** A sealed plan read back: the shape is checked again, since it is only as good as our own signature. */
const PlanShape = z.object({
  role: z.string().max(MAX_ROLE_CHARS),
  pathId: z.string().nullable(),
  experience: z.enum(EXPERIENCE_IDS),
  company: z.string().max(MAX_COMPANY_CHARS),
  focus: z.array(z.string().max(60)).max(6),
  questionIds: z.array(z.string()).max(5),
  custom: z
    .array(
      z.object({
        id: z.string().regex(/^jd-\d$/),
        question: z.string().max(300),
        short_answer: z.string().max(1500),
        deeper_answer: z.string().max(1500),
        follow_ups: z.array(z.string().max(300)).max(2),
        rubric: z.array(z.object({ point: z.string().max(140) })).min(3).max(5),
      }),
    )
    .max(2),
});
export const asPlan = (v: unknown): InterviewPlan | null => {
  const r = PlanShape.safeParse(v);
  return r.success ? (r.data as InterviewPlan) : null;
};

// --------------------------------------------------------------- context --

/** Who the interview is for, from the sealed plan when there is one, else from the setup. Pure. */
export function contextOf(plan: InterviewPlan | null, setup: InterviewSetup | undefined, paths: readonly { id: string; name: string }[]): InterviewContext {
  if (plan) return { role: plan.role, experience: plan.experience, company: plan.company, focus: plan.focus };
  const path = paths.find((p) => p.id === setup?.pathId);
  return { role: path?.name ?? "", experience: setup?.experience ?? null, company: oneLine(setup?.company, MAX_COMPANY_CHARS), focus: [] };
}

/** The lines the prompts add about the role. Empty when nothing was chosen. Learner text is data. */
export function contextBlock(ctx: InterviewContext): string {
  const exp = experienceOf(ctx.experience);
  const lines = [
    ctx.role ? `The candidate is practising for this role: ${asData("role", ctx.role, MAX_ROLE_CHARS)}` : "",
    ctx.company ? `At this company: ${asData("company", ctx.company, MAX_COMPANY_CHARS)}` : "",
    exp ? `The role asks for ${exp.label.toLowerCase()} of experience. Expect answers at that level: do not mark a fresher down for lacking production experience, and expect a senior candidate to talk about trade-offs, scale and decisions they owned.` : "",
    ctx.focus.length ? `The job description stresses: ${ctx.focus.map((f) => asData("skill", f, 60)).join(", ")}` : "",
  ].filter(Boolean);
  return lines.length ? `About the role:\n${lines.join("\n")}` : "";
}

/** A spoken line naming the role, for the interviewer's welcome. Empty when no role was chosen. */
export function roleLine(ctx: InterviewContext): string {
  if (!ctx.role) return "";
  return ctx.company ? `This is a practice interview for the ${ctx.role} role at ${ctx.company}.` : `This is a practice interview for the ${ctx.role} role.`;
}

/** A question by id: a bank question, or one written for this job and carried in the sealed plan. */
export function findQuestion(id: string, bank: ReadonlyMap<string, VoiceQuestion>, plan: InterviewPlan | null): VoiceQuestion | null {
  if (isCustomId(id)) return plan?.custom.find((c) => c.id === id) ?? null;
  return bank.get(id) ?? null;
}
