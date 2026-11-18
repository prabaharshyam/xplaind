import { getGlossary } from "@/lib/content";
import { OG_SIZE, ogCard } from "@/lib/og-card";

// SE-17 (2026-11-18, site review: shares of this page showed no picture).
export const alt = "The Xplaind AI glossary";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "AI glossary",
    title: `${getGlossary().length} AI terms in plain English`,
    footer: "From tokens and embeddings to RAG, agents and fine-tuning, each linked to its lesson",
    from: "#2f5b4e",
    to: "#a9d1c1",
  });
}
