// The level test for one path. All paths with placement "ladder" share the GenAI
// ladder's question bank; the path only decides which lessons come next.
import { getContent } from "@/lib/content";
import type { Goal } from "@/lib/content/schema";
import type { PublicQuestion } from "@/lib/placement/types";
import { PlacementTest } from "./placement-test";

export function TestPage({ goal }: { goal: Goal }) {
  const bank: PublicQuestion[] = getContent().placement.map(({ data: q }) => ({
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
