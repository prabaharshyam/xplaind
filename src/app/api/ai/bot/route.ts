// X Bot's AI answers (signed-in learners only, CO-1 caps apply). XB-3.
import { json } from "@/lib/account/http";
import { aiCatalog, lessonIds, withTitles } from "@/lib/ai/catalog";
import { BotRequest, botPrompt, cleanChat } from "@/lib/ai/features";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";
import { SITE_GUIDE } from "@/lib/bot/guide";

export const maxDuration = 60;

const siteGuide = () => SITE_GUIDE.map((g) => `${g.h} | ${g.t}`).join("\n");

export async function POST(request: Request) {
  const req = await body(request, BotRequest);
  if (req instanceof Response) return req;
  const out = await runAi({ kind: "bot", ...botPrompt(req, aiCatalog(), siteGuide()), maxTokens: 3_000, effort: "low" });
  if (out instanceof Response) return out;
  return json(withTitles(cleanChat(out.data, lessonIds())));
}
