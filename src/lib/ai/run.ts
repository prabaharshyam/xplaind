// Every AI call goes through runAi. Node only. In order: the feature is on, the
// learner is signed in with a confirmed 18+ profile (PV-2), a burst limit, the
// daily and monthly caps (CO-1), the call itself with the output checked against
// a Zod schema (SC-5), then the tokens and cost are written to ai_usage.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { problem, rateLimit, requireSession } from "@/lib/account/http";
import { todayInIST } from "@/lib/dates";
import { type AiKind, costUsd, DAILY_LIMIT, LIMIT_MESSAGE, monthStart, tokenUses } from "./limits";
import { aiSettings } from "./settings";

export type AiRequest<S extends z.ZodType> = {
  kind: AiKind;
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  schema: S;
  maxTokens: number;
  effort: "low" | "medium" | "high";
};

/** Runs one guarded call. Returns the checked output, or a Response to send back as is. */
export async function runAi<S extends z.ZodType>(req: AiRequest<S>): Promise<{ data: z.infer<S> } | Response> {
  const settings = aiSettings();
  if (!settings) return problem(503, LIMIT_MESSAGE.off);

  const session = await requireSession();
  if (session instanceof Response) return session;
  const { user, admin } = session;

  // PV-2: only learners who confirmed they are 18 or over have a profile.
  const { data: profile } = await admin.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (!profile) return problem(403, "Finish setting up your account first. AI features are for learners aged 18 or over.");

  const burst = await rateLimit(admin, `ai:${user.id}`, 60, 6);
  if (burst) return burst;

  const day = todayInIST();
  const { data: verdict, error } = await admin.rpc("ai_reserve", {
    p_user: user.id,
    p_kind: req.kind,
    p_day: day,
    p_month_start: monthStart(day),
    p_daily_max: DAILY_LIMIT[req.kind],
    p_month_cap_usd: settings.monthlyCapUsd,
  });
  // Fail closed: if the guard cannot be checked, no money is spent.
  if (error) return problem(503, "AI is not available right now. Please try again later.");
  if (verdict === "day" || verdict === "month") return problem(429, LIMIT_MESSAGE[verdict as "day" | "month"]);

  const client = new Anthropic({ apiKey: settings.apiKey, maxRetries: 1, timeout: 110_000 });
  // create, not parse: the usage must be recorded even when the output fails the schema.
  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await client.beta.messages.create({
      model: settings.model,
      max_tokens: req.maxTokens,
      system: req.system,
      messages: req.messages,
      output_config: { effort: req.effort, format: betaZodOutputFormat(req.schema) },
      // A refused request is retried once on a fallback model the API picks.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError || e instanceof Anthropic.InternalServerError || e instanceof Anthropic.APIConnectionError) {
      return problem(503, "The AI service is busy. Please try again in a minute.");
    }
    if (e instanceof Anthropic.APIError) return problem(502, "The AI service could not answer that. Please try again.");
    return problem(502, "Something went wrong with that answer. Please try again.");
  }

  const uses = tokenUses(response.usage, settings.model);
  await admin.rpc("ai_record", {
    p_user: user.id,
    p_kind: req.kind,
    p_day: day,
    p_tokens_in: uses.reduce((n, u) => n + u.input, 0),
    p_tokens_out: uses.reduce((n, u) => n + u.output, 0),
    p_cost_usd: costUsd(uses),
  });

  if (response.stop_reason === "refusal") return problem(422, "That request could not be answered. Try asking it a different way.");
  const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  const checked = req.schema.safeParse(safeJson(text));
  if (!checked?.success) return problem(502, "The answer came back incomplete. Please try again.");
  return { data: checked.data };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
