// Every AI call goes through runAi. Node only. In order: the feature is on, who is
// asking (a signed-in learner with a confirmed 18+ profile, or since SU-5 a visitor
// without an account, counted by a daily-rotating hash), a burst limit, the daily
// and monthly caps (CO-1), the call itself with the output checked against a Zod
// schema (SC-5), then the tokens and cost are written to the usage table.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { json, problem, rateLimit } from "@/lib/account/http";
import { proOpen } from "@/lib/billing/config";
import { accountsEnabled } from "@/lib/supabase/config";
import { serviceClient } from "@/lib/supabase/server";
import { todayInIST } from "@/lib/dates";
import {
  type AiKind,
  costUsd,
  LIMIT_MESSAGE,
  modelFor,
  monthStart,
  offersFallback,
  tokenUses,
} from "./limits";
import { aiSettings } from "./settings";
import { aiCaller, limitFor } from "./who";

/** Effectively no site-wide cap for Pro calls; the kill switch still stops everything. */
const PRO_MONTH_CAP_USD = 1_000_000;

export type AiRequest<S extends z.ZodType> = {
  kind: AiKind;
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  schema: S;
  maxTokens: number;
  effort: "low" | "medium" | "high";
};

/** Runs one guarded call. Returns the checked output, or a Response to send back as is. */
export async function runAi<S extends z.ZodType>(
  req: AiRequest<S>,
): Promise<{ data: z.infer<S> } | Response> {
  const settings = aiSettings();
  if (!settings) return problem(503, LIMIT_MESSAGE.off);

  const admin = serviceClient();
  if (!admin) return problem(503, LIMIT_MESSAGE.off);
  const who = await aiCaller(admin);

  const burst = await rateLimit(admin, `ai:${who.id}`, 60, 6);
  if (burst) return burst;

  const day = todayInIST();
  const monthCap =
    who.tier === "pro" ? PRO_MONTH_CAP_USD : settings.monthlyCapUsd;
  // AG-1 (owner decision, 2026-11-10): once sign-ups are open, AI needs an account; nothing is spent on guests.
  // While sign-ups are on hold (SU-4) nobody can sign in, so guests keep their per-feature limits (SU-5).
  if (who.guest && accountsEnabled())
    return json({ error: LIMIT_MESSAGE.signin, signin: true }, 401);
  const { data: verdict, error } = await admin.rpc(
    who.guest ? "ai_reserve_guest" : "ai_reserve",
    {
      ...(who.guest ? { p_visitor: who.id } : { p_user: who.id }),
      p_kind: req.kind,
      p_day: day,
      p_month_start: monthStart(day),
      p_daily_max: limitFor(req.kind, who),
      // PAY-1: a learner with a pass is bounded by their own daily limits, not the site's free monthly cap.
      p_month_cap_usd: monthCap,
    },
  );
  // Fail closed: if the guard cannot be checked, no money is spent.
  if (error)
    return problem(
      503,
      "AI is not available right now. Please try again later.",
    );
  if (verdict === "signin")
    return json({ error: LIMIT_MESSAGE.signin, signin: true }, 401);
  // PAY-4: when a pass would give more today, say so, and the browser offers the pricing page.
  if (verdict === "day" && proOpen() && who.tier !== "pro")
    return json({ error: LIMIT_MESSAGE.dayUpgrade, upgrade: "/pricing" }, 429);
  if (verdict === "day" || verdict === "month")
    return problem(429, LIMIT_MESSAGE[verdict as "day" | "month"]);
  const model = modelFor(req.kind, settings.model, settings.fastModel);

  const client = new Anthropic({
    apiKey: settings.apiKey,
    maxRetries: 1,
    timeout: 110_000,
  });
  // create, not parse: the usage must be recorded even when the output fails the schema.
  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await client.beta.messages.create({
      model,
      max_tokens: req.maxTokens,
      system: req.system,
      messages: req.messages,
      output_config: {
        effort: req.effort,
        format: betaZodOutputFormat(req.schema),
      },
      // A refused request is retried once on a fallback model the API picks (larger models only).
      ...(offersFallback(model)
        ? {
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default" as const,
          }
        : {}),
    });
  } catch (e) {
    if (
      e instanceof Anthropic.RateLimitError ||
      e instanceof Anthropic.InternalServerError ||
      e instanceof Anthropic.APIConnectionError
    ) {
      return problem(
        503,
        "The AI service is busy. Please try again in a minute.",
      );
    }
    if (e instanceof Anthropic.APIError)
      return problem(
        502,
        "The AI service could not answer that. Please try again.",
      );
    return problem(
      502,
      "Something went wrong with that answer. Please try again.",
    );
  }

  const uses = tokenUses(response.usage, model);
  await admin.rpc(who.guest ? "ai_record_guest" : "ai_record", {
    ...(who.guest ? { p_visitor: who.id } : { p_user: who.id }),
    p_kind: req.kind,
    p_day: day,
    p_tokens_in: uses.reduce((n, u) => n + u.input, 0),
    p_tokens_out: uses.reduce((n, u) => n + u.output, 0),
    p_cost_usd: costUsd(uses),
  });

  if (response.stop_reason === "refusal")
    return problem(
      422,
      "That request could not be answered. Try asking it a different way.",
    );
  const text = response.content
    .flatMap((b) => (b.type === "text" ? [b.text] : []))
    .join("");
  const checked = req.schema.safeParse(safeJson(text));
  if (!checked?.success)
    return problem(502, "The answer came back incomplete. Please try again.");
  return { data: checked.data };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
