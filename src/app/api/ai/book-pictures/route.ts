// MB-12: reads picture pages from the learner's own notes into text (Pro only). The pictures are not stored.
import { json, problem } from "@/lib/account/http";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";
import { LIMIT_MESSAGE } from "@/lib/ai/limits";
import { SCAN_PRO_ONLY, SCAN_SYSTEM, ScanOutput, ScanRequest, cleanScanOutput, scanMessages } from "@/lib/ai/scan";
import { aiCaller } from "@/lib/ai/who";
import { proOpen } from "@/lib/billing/config";
import { accountsEnabled } from "@/lib/supabase/config";
import { serviceClient } from "@/lib/supabase/server";

export const maxDuration = 120;

export async function POST(request: Request) {
  const admin = serviceClient();
  if (!admin) return problem(503, LIMIT_MESSAGE.off);
  // Pro only: checked before the pictures are even read, so a free account never costs a model call.
  const who = await aiCaller(admin);
  if (who.guest && accountsEnabled()) return json({ error: LIMIT_MESSAGE.signin, signin: true }, 401);
  if (who.tier !== "pro") return json({ error: SCAN_PRO_ONLY, ...(proOpen() ? { upgrade: "/pricing" } : {}) }, 403);

  const req = await body(request, ScanRequest, 2_200_000); // up to 4 pictures of about 360 KB, as text
  if (req instanceof Response) return req;
  const out = await runAi({ kind: "scan", system: SCAN_SYSTEM, messages: scanMessages(req), schema: ScanOutput, maxTokens: 8_000, effort: "low", burst: 12 });
  if (out instanceof Response) return out;
  return json({ pages: cleanScanOutput(out.data, req.images.map((i) => i.id)) });
}
