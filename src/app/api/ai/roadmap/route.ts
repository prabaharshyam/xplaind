// AI roadmap generator and editor (signed-in learners only, CO-1 caps apply).
import { z } from "zod";
import { json } from "@/lib/account/http";
import { aiCatalog, lessonIds } from "@/lib/ai/catalog";
import { refinePrompt, roadmapPrompt } from "@/lib/ai/features";
import { cleanRoadmap, RefineRequest, RoadmapRequest } from "@/lib/ai/roadmap";
import { body } from "@/lib/ai/route";
import { runAi } from "@/lib/ai/run";

export const maxDuration = 120;

const Body = z.discriminatedUnion("mode", [
  RoadmapRequest.extend({ mode: z.literal("new") }),
  RefineRequest.extend({ mode: z.literal("refine") }),
]);

export async function POST(request: Request) {
  const req = await body(request, Body);
  if (req instanceof Response) return req;
  const prompt = req.mode === "new" ? roadmapPrompt(req, aiCatalog()) : refinePrompt(req.roadmap, req.instruction, aiCatalog());
  const out = await runAi({ kind: "roadmap", ...prompt, maxTokens: 16_000, effort: "medium" });
  if (out instanceof Response) return out;
  return json({ roadmap: cleanRoadmap(out.data, lessonIds()) });
}
