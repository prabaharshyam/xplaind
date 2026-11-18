import { OG_SIZE, ogCard } from "@/lib/og-card";

// SE-17 (2026-11-18, site review: shares of this page showed no picture).
export const alt = "Zarina, the Xplaind AI mock interviewer";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "AI mock interviewer",
    title: "Mock interviews that talk back",
    footer: "Zarina asks out loud, follows up on what you say and scores you like a hiring panel",
    from: "#061f22",
    to: "#2a9488",
  });
}
