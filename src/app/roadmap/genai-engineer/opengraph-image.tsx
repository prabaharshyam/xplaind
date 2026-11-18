import { getPath } from "@/lib/content";
import { OG_SIZE, ogCard } from "@/lib/og-card";
import { themeOf } from "@/lib/themes";

// SE-17 (2026-11-18, site review): this roadmap has its own route, so it needs its own share picture.
export const alt = "The Xplaind Generative AI roadmap";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  const path = getPath("genai-engineer");
  const theme = themeOf(path?.theme ?? "llm");
  return ogCard({
    eyebrow: "Role roadmap",
    title: `${path?.name ?? "Generative AI Engineer"} roadmap`,
    footer: path ? `${path.tagline} Free lessons, projects and interview practice.` : "One clear roadmap per AI role",
    from: theme.from,
    to: theme.to,
  });
}
