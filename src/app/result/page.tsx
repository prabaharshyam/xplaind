import type { Metadata } from "next";
import { getContent, getPaths } from "@/lib/content";
import { lessonsByPath, pathRef } from "@/lib/content/paths";
import type { PublicQuestion } from "@/lib/placement/types";
import { ResultView } from "./result-view";

export const metadata: Metadata = {
  title: "Your level",
  description: "Your starting level and next steps on your path.",
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
  const tested = getPaths().filter((p) => p.placement === "ladder");
  const all = lessonsByPath();
  const stopsByPath = Object.fromEntries(tested.map((p) => [p.id, all[p.id]]));
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
      <ResultView levels={levels} paths={tested.map(pathRef)} stopsByPath={stopsByPath} bank={bank} />
    </main>
  );
}
