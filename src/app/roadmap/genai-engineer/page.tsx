import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { getPath } from "@/lib/content";
import { RoadmapPage } from "../roadmap-page";
import { GOAL_ID } from "./data";

export const metadata: Metadata = pageMeta({
  // SE-8: "generative ai roadmap 2026", "generative ai roadmap for beginners", "llm engineer roadmap".
  title: ["Generative AI Roadmap 2026: Step by Step to LLM Engineer", "Generative AI Roadmap 2026"],
  description:
    "Generative AI roadmap for 2026, from beginner to LLM engineer in nine levels: Python, LLM APIs, prompting, RAG, agents, evals and deployment, each step with the best course.",
  path: "/roadmap/genai-engineer",
});

export default function GenAiRoadmapPage() {
  return <RoadmapPage path={getPath(GOAL_ID)!} />;
}
