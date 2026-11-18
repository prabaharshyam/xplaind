import { OG_SIZE, ogCard } from "@/lib/og-card";

// SE-17 (2026-11-18, site review: shares of this page showed no picture).
export const alt = "Xplaind Pro: get interview-ready, with proof";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "Xplaind Pro",
    title: "Get interview-ready, with proof",
    footer: "An AI interviewer, reviewed projects, a resume matched to the job · from ₹4.1 a day",
    from: "#0e4a50",
    to: "#14b8a6",
  });
}
