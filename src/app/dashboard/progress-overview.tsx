"use client";

import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { useActivity, useGame, usePractice, useProgress } from "@/lib/browser/hooks";
import { RANKS } from "@/lib/game/xp";
import type { IconName } from "@/lib/themes";

const BADGE_ICON: Record<string, IconName> = {
  "first-step": "play",
  "on-a-roll": "bolt",
  perfect: "star",
  builder: "code",
  "spoke-up": "mic",
  "interview-ready": "check",
  "three-days": "fire",
  "week-streak": "fire",
  "xp-500": "trophy",
};

/** XP, rank, streak, badges and counts, from this device. Works without an account. */
export function ProgressOverview() {
  const game = useGame();
  const progress = useProgress();
  const practice = usePractice();
  const activity = useActivity();
  const done = Object.values(progress.stops).filter((s) => s.status === "done").length;
  const started = Object.values(progress.stops).filter((s) => s.status === "in_progress").length;

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="XP and streak" className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 p-5 text-white sm:col-span-2">
          <p className="text-sm text-white/85">Your rank</p>
          <p className="mt-1 text-3xl font-semibold">{game.rank.name}</p>
          <p className="mt-1 text-lg">{game.xp} XP</p>
          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/30"
            role="progressbar"
            aria-label={game.rank.next ? `Progress to ${game.rank.next.name}` : "Top rank reached"}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(game.rank.progress * 100)}
          >
            <div className="h-full rounded-full bg-white" style={{ width: `${Math.round(game.rank.progress * 100)}%` }} />
          </div>
          <p className="mt-2 text-sm text-white/90">
            {game.rank.next ? `${game.rank.next.min - game.xp} XP to ${game.rank.next.name}` : "You reached the top rank."}
          </p>
        </div>
        <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-amber-950">
          <p className="text-sm">Streak</p>
          <p className="flex items-center gap-2 text-4xl font-semibold">
            <Icon name="fire" size={34} /> {game.streak}
          </p>
          <p className="text-sm">{game.streak === 1 ? "day" : "days"} in a row. Learn something today to keep it.</p>
        </div>
      </section>

      <section aria-labelledby="counts-h">
        <h2 id="counts-h" className="sr-only">
          Your numbers
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Lessons done", done],
            ["In progress", started],
            ["Questions practised", Object.keys(practice.ratings).length],
            ["Mock interviews", activity.interviews.length],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <dt className="text-sm text-zinc-600 dark:text-zinc-400">{k}</dt>
              <dd className="mt-1 text-2xl font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="badges-h">
        <h2 id="badges-h" className="text-xl font-semibold">
          Badges
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {game.badges.map((b) => (
            <li
              key={b.id}
              className={`flex items-center gap-3 rounded-2xl border p-3 ${b.earned ? "border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/40" : "border-dashed border-zinc-300 dark:border-zinc-700"}`}
            >
              <span className={`grid size-11 shrink-0 place-items-center rounded-full ${b.earned ? "bg-violet-600 text-white" : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800"}`}>
                <Icon name={b.earned ? (BADGE_ICON[b.id] ?? "star") : "lock"} size={20} />
              </span>
              <span>
                <span className="block font-medium">{b.name}</span>
                <span className="block text-xs text-zinc-600 dark:text-zinc-400">
                  {b.earned ? "Earned" : "Locked"}: {b.description}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how-xp" className="rounded-2xl bg-zinc-100 p-5 text-sm leading-6 dark:bg-zinc-900">
        <h2 id="how-xp" className="font-semibold">
          How to earn XP
        </h2>
        <p className="mt-1">
          Pass a lesson check: 50 XP (70 for a perfect score). Submit a project: 80. Rate a practice question: 5. Each
          answered mock interview question: 10, plus points for the key points you cover. Ranks: {RANKS.map((r) => r.name).join(", ")}.
        </p>
        <p className="mt-2">Saved in this browser. Clearing your browser data clears it.</p>
        <Link href="/paths" className="mt-3 inline-block font-medium text-emerald-800 underline underline-offset-2 dark:text-emerald-400">
          Continue learning
        </Link>
      </section>
    </div>
  );
}
