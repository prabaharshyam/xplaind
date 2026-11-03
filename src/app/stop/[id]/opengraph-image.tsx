import { getLevel, getStop } from "@/lib/content";
import { OG_SIZE, ogCard } from "@/lib/og-card";
import { themeOf } from "@/lib/themes";
import { levelWords } from "@/lib/levels";

export const alt = "An Xplaind lesson";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const stop = getStop((await params).id);
  const theme = themeOf(stop?.theme ?? "ai-basics");
  const level = stop ? getLevel(stop.level) : undefined;
  return ogCard({
    eyebrow: `${theme.label} lesson`,
    title: stop?.title ?? "Xplaind lesson",
    footer: stop ? `${levelWords(stop.level)}: ${level?.name ?? ""} · about ${stop.hours} ${stop.hours === 1 ? "hour" : "hours"} · with video lessons` : "Plain-English AI lessons",
    from: theme.from,
    to: theme.to,
  });
}
