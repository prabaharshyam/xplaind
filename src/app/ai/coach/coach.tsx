"use client";

import { useMemo } from "react";
import { AiChat } from "@/components/ai/ai-chat";
import { AiGate, useAiAccess } from "@/components/ai/ai-gate";
import { useAttempt, useCurrentPathId, useGame, useProgress } from "@/lib/browser/hooks";

/** The personal coach. It sees a short summary of progress on this device, shown to the learner first. */
export function Coach({ enabled, paths, titles }: { enabled: boolean; paths: { id: string; name: string }[]; titles: Record<string, string> }) {
  const access = useAiAccess(enabled);
  const progress = useProgress();
  const { result } = useAttempt();
  const game = useGame();
  const pathId = useCurrentPathId(paths.map((p) => p.id));
  const pathName = paths.find((p) => p.id === pathId)?.name ?? "not chosen yet";

  const context = useMemo(() => {
    const done = Object.entries(progress.stops)
      .filter(([, s]) => s.status === "done")
      .sort((a, b) => b[1].updatedOn.localeCompare(a[1].updatedOn));
    const recent = done.slice(0, 6).map(([id]) => titles[id] ?? id);
    return [
      `Path: ${pathName}.`,
      result ? `Placement test level: ${result.startLevel}.` : "Has not taken the placement test.",
      `Lessons done: ${done.length}${recent.length ? ` (latest: ${recent.join("; ")})` : ""}.`,
      `XP: ${game.xp} (${game.rank.name}). Weekly streak: ${game.streak}.`,
    ].join(" ");
  }, [progress.stops, result, game, pathName, titles]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section aria-labelledby="coach-chat" className="min-w-0 rounded-3xl border border-zinc-200 bg-white p-4 md:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 id="coach-chat" className="sr-only">
          Chat with your coach
        </h2>
        <AiGate access={access} next="/ai/coach">
          <AiChat
            endpoint="/api/ai/coach"
            extra={{ context }}
            greeting="Hi! I'm your learning coach. Tell me your goal or what's blocking you, and I'll help you plan your next week."
            starters={["What should I learn this week?", "I have 5 hours a week. Make me a plan.", "How do I get my first AI job in India?", "I keep losing motivation. What should I do?"]}
            placeholder="Ask your coach"
          />
        </AiGate>
      </section>
      <aside className="text-sm lg:sticky lg:top-20 lg:self-start">
        <h2 className="font-semibold">What your coach sees</h2>
        <p className="mt-2 rounded-xl bg-zinc-100 p-3 leading-6 dark:bg-zinc-800">{context}</p>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">This summary of your progress on this device is sent with each message so the advice fits you. Nothing else is shared, and the chat is not saved.</p>
      </aside>
    </div>
  );
}
