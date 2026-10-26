import type { Metadata } from "next";
import { getPath } from "@/lib/content";
import { RoadmapPage } from "../roadmap-page";
import { GOAL_ID } from "./data";

export const metadata: Metadata = {
  title: "GenAI Engineer roadmap: free, step by step",
  description:
    "A free GenAI engineer roadmap in nine levels, from AI newcomer to AI system designer: Python, LLM APIs, RAG, agents, evals and deployment, each step with the best free course.",
  alternates: { canonical: "/roadmap/genai-engineer" },
};

export default function GenAiRoadmapPage() {
  return <RoadmapPage path={getPath(GOAL_ID)!} />;
}
