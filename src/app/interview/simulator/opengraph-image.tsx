import { OG_SIZE, ogCard } from "@/lib/og-card";

// SE-17 (2026-11-18, site review: shares of this page showed no picture).
export const alt = "Zarina, the Xplaind AI mock interviewer";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "AI mock interviewer",
    title: "AI mock interviews that score you like a hiring panel",
    footer: "Asks out loud, follows up on what you say, and ends with a verdict, skill scores and a plan",
    from: "#061f22",
    to: "#2a9488",
  });
}
