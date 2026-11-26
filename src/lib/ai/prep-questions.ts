// PREP-6 (2026-11-26, owner decision): questions written by AI for the learner's pasted job post, for
// their interview prep plan. Pro only. They are the one kind of question no person has reviewed, so they
// are always shown as "Generated for your JD" and never join the reviewed bank. The job post is not
// stored on the server. Pure: no network, no database. The job post is data, never instructions (SC-5).
import { z } from "zod";
import { EXPERIENCE_IDS, experienceOf } from "@/lib/interview/setup";
import { GENERATED_COUNT, MAX_JD_CHARS, MIN_JD_CHARS, type GeneratedQuestion } from "@/lib/prep/job";
import { asData, DATA_RULE } from "./prompt";

export const PREP_PRO_ONLY = "Questions written for your job post are part of Pro. Matching the post to our question bank needs no pass.";

export const PrepQuestionsRequest = z.strictObject({
  jd: z.string().trim().min(MIN_JD_CHARS, "Paste a little more of the job post.").max(MAX_JD_CHARS),
  role: z.string().trim().min(1).max(80),
  experience: z.enum(EXPERIENCE_IDS),
  /** Bank questions already in the plan, so the new ones do not repeat them. */
  have: z.array(z.string().max(300)).max(60),
});
export type PrepQuestionsRequest = z.infer<typeof PrepQuestionsRequest>;

export const PrepQuestionsOutput = z.object({
  is_job_description: z.boolean(),
  questions: z.array(z.object({ question: z.string(), short_answer: z.string(), deeper_answer: z.string() })),
});
export type PrepQuestionsOutput = z.infer<typeof PrepQuestionsOutput>;

export function prepQuestionsPrompt(req: PrepQuestionsRequest) {
  const level = experienceOf(req.experience)!.short;
  const system = [
    "You write interview practice questions for Xplaind, an AI career site, from a job post a learner pasted. They are preparing for an interview for that job.",
    DATA_RULE,
    "is_job_description: false if the text is clearly not a job post or job description; then return an empty questions list.",
    `questions: exactly ${GENERATED_COUNT} questions this interview is likely to include because of what the post names: its tools, its domain, its duties and its seniority. Pitch them for a candidate with ${level}. Mix kinds: explain a concept the post depends on, a scenario from the duties, a design or trade-off question, and one or two on the domain or industry. Do not repeat the questions listed as already in the plan, and do not write generic behavioural questions.`,
    "Each question: question, one question of at most 35 words; short_answer, 40 to 60 words, how a strong candidate answers; deeper_answer, 90 to 150 words, the reasoning, a concrete example and one common mistake to avoid.",
    "Be accurate. If the post names a tool you do not know well, ask about the task it is used for rather than its details. Never invent facts about the company. Never ask about age, religion, caste, marriage, health, salary or anything personal. Plain, direct English, short sentences, no jargon without a reason.",
  ].join("\n\n");
  const content = [
    `Role the learner chose: ${asData("role", req.role, 80)}`,
    `Job post:\n${asData("job_post", req.jd, MAX_JD_CHARS)}`,
    req.have.length ? `Already in the plan (do not repeat):\n${req.have.map((q) => `- ${q.replace(/\s+/g, " ").slice(0, 300)}`).join("\n")}` : "",
    "Write the questions.",
  ]
    .filter(Boolean)
    .join("\n\n");
  return { system, messages: [{ role: "user" as const, content }], schema: PrepQuestionsOutput };
}

const tidy = (s: unknown, n: number) =>
  String(s ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim()
    .slice(0, n);

/** The model's questions cleaned, capped and given their "jd-" ids; ones too short to be useful are dropped. Pure, for tests. */
export function cleanGenerated(out: PrepQuestionsOutput): GeneratedQuestion[] {
  return out.questions
    .map((q) => ({ question: tidy(q.question, 300).replace(/\s+/g, " "), short_answer: tidy(q.short_answer, 700), deeper_answer: tidy(q.deeper_answer, 1800) }))
    .filter((q) => q.question.length >= 15 && q.short_answer.length >= 40 && q.deeper_answer.length >= 40)
    .slice(0, GENERATED_COUNT)
    .map((q, i) => ({ id: `jd-${i + 1}`, ...q }));
}
