import { OG_SIZE, ogCard } from "@/lib/og-card";

export const alt = "Xplaind: learn AI for the job you want";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "AI career roadmaps",
    title: "Learn AI for the job you want. One clear roadmap per role.",
    footer: "Plain-English lessons, video lessons, projects and interview practice",
    from: "#7c3aed",
    to: "#f472b6",
  });
}
