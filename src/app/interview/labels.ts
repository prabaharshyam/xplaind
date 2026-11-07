import type { IconName } from "@/lib/themes";

/** IP-1: how each pattern category is named and drawn. */
export const CATEGORY: Record<string, { label: string; lead: string; icon: IconName }> = {
  retrieval: { label: "Retrieval and RAG", lead: "Find the right text and answer from it.", icon: "search" },
  agents: { label: "Agents", lead: "Models that take steps and use tools, safely.", icon: "bolt" },
  evals: { label: "Evaluation", lead: "Prove it works, and keep it working.", icon: "check" },
  serving: { label: "Serving and cost", lead: "Fast, reliable and affordable in production.", icon: "flow" },
  safety: { label: "Safety", lead: "Limit what can go wrong.", icon: "shield" },
};
