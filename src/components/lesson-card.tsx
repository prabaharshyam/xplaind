import Link from "next/link";
import { Cover } from "@/components/art/cover";
import type { ThemeId } from "@/lib/themes";
import { themeOf } from "@/lib/themes";

export type LessonCardData = { id: string; title: string; outcome: string; hours: number; level: string; theme: ThemeId };

/** A lesson as a picture card, for topic pages and lists. */
export function LessonCard({ l }: { l: LessonCardData }) {
  return (
    <Link
      data-tilt
      href={`/stop/${l.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <Cover theme={l.theme} seed={l.id} className="h-24" iconSize={30} />
      <span className="flex flex-1 flex-col p-4">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {themeOf(l.theme).label} · {l.level} · about {l.hours} h
        </span>
        <span className="mt-1 font-semibold leading-6 group-hover:underline">{l.title}</span>
        <span className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{l.outcome}</span>
      </span>
    </Link>
  );
}
