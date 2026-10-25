import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import type { PublicQuestion } from "@/lib/placement/types";
import { PlacementTest } from "./placement-test";

export const metadata: Metadata = {
  title: "Find my level",
  description: "A short test finds your level on the GenAI Engineer path. No sign-up needed.",
};

export default function StartPage() {
  const content = getContent();
  const goal = content.goals[0].data;
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
      <PlacementTest goal={{ id: goal.id, name: goal.name }} bank={bank} />
    </main>
  );
}
