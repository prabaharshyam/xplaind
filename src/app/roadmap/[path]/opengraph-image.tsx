import { getPath } from "@/lib/content";
import { OG_SIZE, ogCard } from "@/lib/og-card";
import { themeOf } from "@/lib/themes";

// SE-17 (2026-11-18, site review: shares of roadmaps showed no picture).
export const alt = "An Xplaind role roadmap";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ path: string }> }) {
  const path = getPath((await params).path);
  const theme = themeOf(path?.theme ?? "llm");
  return ogCard({
    eyebrow: "Role roadmap",
    title: path ? `${path.name} roadmap` : "AI career roadmap",
    footer: path ? `${path.tagline} Free lessons, projects and interview practice.` : "One clear roadmap per AI role",
    from: theme.from,
    to: theme.to,
  });
}
