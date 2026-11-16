// VI-3: can this visitor start an AI voice interview? Spends nothing, so the browser can ask before the
// learner answers a single question.
import { json } from "@/lib/account/http";
import { voiceAccess } from "@/lib/ai/voice-access";

export async function GET() {
  const access = await voiceAccess();
  return access instanceof Response ? access : json({ ok: true });
}
