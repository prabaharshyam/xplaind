// AI roadmap generator (CO-1 caps apply; no account needed since SU-5).
import { z } from "zod";
import { json } from "@/lib/account/http";
import { aiCatalog, lessonIds } from "@/lib/ai/catalog";
import { roadmapPrompt } from "@/lib/ai/features";
import { cleanRoadmap, RoadmapRequest } from "@/lib/ai/roadmap";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";

export const maxDuration = 120;

// Only new roadmaps: editing with AI was removed (owner, 2026-11-02); a roadmap is edited by hand.
const Body = RoadmapRequest.extend({ mode: z.literal("new") });

export async function POST(request: Request) {
  const req = await body(request, Body);
  if (req instanceof Response) return req;
  const prompt = roadmapPrompt(req, aiCatalog());
  const out = await runAi({ kind: "roadmap", ...prompt, maxTokens: 16_000, effort: "medium" });
  if (out instanceof Response) return out;
  return json({ roadmap: cleanRoadmap(out.data, lessonIds()) });
}
