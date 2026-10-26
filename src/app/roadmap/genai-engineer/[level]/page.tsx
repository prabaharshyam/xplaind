import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { muted, textLink } from "@/components/ui";
import { LEVEL_IDS, type LevelId, isLevelId } from "@/lib/levels";
import { levelSlug, roadmapData } from "../data";
import { StopList } from "../stop-list";

const fromSlug = (slug: string): LevelId | null => {
  const id = slug.toUpperCase();
  return slug === slug.toLowerCase() && isLevelId(id) ? id : null;
};

export function generateStaticParams() {
  return LEVEL_IDS.map((l) => ({ level: levelSlug(l) }));
}

export async function generateMetadata({ params }: PageProps<"/roadmap/genai-engineer/[level]">): Promise<Metadata> {
  const id = fromSlug((await params).level);
  const level = id && roadmapData().levels.find((l) => l.id === id);
  return level ? { title: `${level.id} ${level.name}`, description: `${level.can_do}.` } : {};
}

export default async function LevelPage({ params }: PageProps<"/roadmap/genai-engineer/[level]">) {
  const id = fromSlug((await params).level);
  if (!id) notFound();
  const { levels, stops } = roadmapData();
  const level = levels.find((l) => l.id === id)!;
  const levelStops = stops.filter((s) => s.level === id);
  const at = LEVEL_IDS.indexOf(id);
  const prev = LEVEL_IDS[at - 1];
  const next = LEVEL_IDS[at + 1];
  const written = levelStops.reduce((sum, s) => sum + s.hours, 0);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/roadmap/genai-engineer" className={textLink}>
          Roadmap
        </Link>
      </nav>
      <p className={`mt-4 text-sm ${muted}`}>
        Level {at + 1} of {LEVEL_IDS.length}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance">
        {level.id} {level.name}
      </h1>
      <p className="mt-4 leading-7">
        <span className="font-medium">At the end you can:</span> {level.can_do}.
      </p>
      <p className={`mt-2 text-sm ${muted}`}>
        About {level.draft_hours} hours in all{levelStops.length > 0 ? `; the steps written so far take about ${written}` : ""}.
      </p>

      <h2 className="mt-8 mb-3 text-xl font-semibold">Steps</h2>
      <StopList stops={levelStops} showOutcome />

      <h2 className="mt-8 text-xl font-semibold">Level project</h2>
      <p className="mt-2 leading-7">{level.exit_check}.</p>

      <nav aria-label="Other levels" className="mt-10 flex justify-between gap-4 text-sm">
        {prev ? (
          <Link href={`/roadmap/genai-engineer/${levelSlug(prev)}`} className={textLink}>
            ← {prev}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/roadmap/genai-engineer/${levelSlug(next)}`} className={textLink}>
            {next} →
          </Link>
        )}
      </nav>
    </main>
  );
}
