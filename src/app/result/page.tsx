import type { Metadata } from "next";
import { getContent, getStopsInOrder } from "@/lib/content";
import type { PublicQuestion } from "@/lib/placement/types";
import { ResultView } from "./result-view";

export const metadata: Metadata = {
  title: "Your level",
  description: "Your starting level on the GenAI Engineer path.",
  robots: { index: false },
};

export default function ResultPage() {
  const content = getContent();
  const levels = content.levels.map(({ data: l }) => ({
    id: l.id,
    name: l.name,
    can_do: l.can_do,
    draft_hours: l.draft_hours,
    exit_check: l.exit_check,
  }));
  const stops = getStopsInOrder().map((s) => ({
    id: s.id,
    title: s.title,
    level: s.level,
    order: s.order,
    hours: s.hours,
    gap_tags: s.gap_tags,
  }));
  const bank: PublicQuestion[] = content.placement.map(({ data: q }) => ({
    id: q.id,
    level: q.level,
    topic_tags: q.topic_tags,
    stem: q.stem,
    options: q.options,
    correct: q.correct,
    explanation: q.explanation,
  }));
  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <ResultView levels={levels} stops={stops} bank={bank} />
    </main>
  );
}
