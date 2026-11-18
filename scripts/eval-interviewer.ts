// npm run eval:interviewer [-- --case <id>] [-- --model <model id>]
// VI-15: runs the red-team cases in scripts/evals/interviewer-cases.json against the real AI interviewer
// (the same prompt, model and checks as /api/ai/voice/turn) and prints pass or fail for each. Needs
// ANTHROPIC_API_KEY. Each full run is about 30 calls to the fast model (well under ₹5). Exit code 1 if
// any case fails. Not part of `npm run check`: it costs money and the model's answers vary a little.
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { DEFAULT_FAST_MODEL } from "@/lib/ai/limits";
import {
  cleanTurn,
  languageRedirect,
  turnDecision,
  voiceTurnPrompt,
  type Exchange,
  type VoiceQuestion,
} from "@/lib/ai/voice-interview";
import { loadContent } from "@/lib/content/load";

type Outcome = "language" | "topic" | "clarify" | "follow_up" | "move_on";
type Case = {
  id: string;
  reply?: string;
  earlier?: Exchange[];
  expect: Outcome[];
  mustNot?: string[];
};

const args = process.argv.slice(2);
const opt = (name: string) =>
  args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const file = JSON.parse(
  fs.readFileSync(path.resolve("scripts/evals/interviewer-cases.json"), "utf8"),
) as { question: string; cases: Case[] };
const only = opt("--case");
const model =
  opt("--model") ?? (process.env.AI_FAST_MODEL?.trim() || DEFAULT_FAST_MODEL);

const { bundle } = loadContent(path.resolve("content"));
const q = bundle.interview.find((x) => x.data.id === file.question)?.data as
  | VoiceQuestion
  | undefined;
if (!q) throw new Error(`No interview question ${file.question}`);
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("Set ANTHROPIC_API_KEY to run the interviewer eval.");
  process.exit(2);
}
// Straight to Anthropic, never to a base URL set for another tool in this shell.
const client = new Anthropic({ apiKey, baseURL: process.env.EVAL_ANTHROPIC_BASE_URL ?? "https://api.anthropic.com", maxRetries: 2, timeout: 60_000 });

/** "(?i)" at the start means case-insensitive, as in the cases file. */
const pattern = (p: string) =>
  p.startsWith("(?i)") ? new RegExp(p.slice(4), "iu") : new RegExp(p, "u");

async function run(c: Case): Promise<{ outcome: Outcome; line: string }> {
  const exchanges: Exchange[] = c.earlier?.length
    ? c.earlier.map((e) => ({ ...e, seconds: e.seconds ?? 30 }))
    : [{ asked: "", answer: c.reply ?? "", seconds: 30 }];
  // The same order as the route: the fixed English line first, then the model.
  const english = languageRedirect(q!, exchanges);
  if (english !== undefined)
    return english
      ? { outcome: "language", line: english }
      : { outcome: "move_on", line: "" };
  if (turnDecision(exchanges) === "done")
    return { outcome: "move_on", line: "" };
  const prompt = voiceTurnPrompt(q!, exchanges);
  const res = await client.beta.messages.create({
    model,
    max_tokens: 300,
    system: prompt.system,
    messages: prompt.messages,
    output_config: {
      effort: "low",
      format: betaZodOutputFormat(prompt.schema),
    },
  });
  const text = res.content
    .flatMap((b) => (b.type === "text" ? [b.text] : []))
    .join("");
  const out = prompt.schema.parse(JSON.parse(text));
  const next = cleanTurn(out, q!, exchanges);
  if (!next) return { outcome: "move_on", line: "" };
  return {
    outcome: next.redirect ?? (next.clarify ? "clarify" : "follow_up"),
    line: next.line,
  };
}

async function main() {
  const cases = file.cases.filter((c) => !only || c.id === only);
  let failed = 0;
  for (const c of cases) {
    try {
      const { outcome, line } = await run(c);
      const bad = (c.mustNot ?? []).filter((p) => pattern(p).test(line));
      const ok = c.expect.includes(outcome) && bad.length === 0;
      if (!ok) failed++;
      console.log(
        `${ok ? "PASS" : "FAIL"}  ${c.id.padEnd(24)} ${outcome.padEnd(10)} ${line}${bad.length ? `\n      matched: ${bad.join(", ")}` : ""}${ok ? "" : `\n      expected: ${c.expect.join(" or ")}`}`,
      );
    } catch (e) {
      failed++;
      console.log(`ERROR ${c.id.padEnd(24)} ${(e as Error).message}`);
    }
  }
  console.log(
    `\n${cases.length - failed} of ${cases.length} passed (model ${model}).`,
  );
  process.exit(failed ? 1 : 0);
}

void main();
