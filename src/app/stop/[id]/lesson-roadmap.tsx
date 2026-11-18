"use client";

import Link from "next/link";
import { type ReactNode, createContext, useContext, useSyncExternalStore } from "react";
import { muted } from "@/components/ui";
import { lastRoadmap, markReturn } from "@/lib/browser/roadmap-return";
import { PathLessons } from "./path-lessons";

/** A roadmap this lesson is on: its name, page and lesson order. */
export type LessonRoadmap = { id: string; name: string; href: string; lessons: string[]; crumbs?: { href: string; label: string }[] };

const noop = () => () => {};

type Ctx = { roadmap: LessonRoadmap | null; titles: Record<string, string>; current: string };
const RoadmapContext = createContext<Ctx>({ roadmap: null, titles: {}, current: "" });

/**
 * RM-16: a lesson can sit on several roadmaps. It follows the one the learner opened it from in this
 * visit (back link, lesson list, previous and next); otherwise its first roadmap, which is also what the
 * server renders, so search engines and first paints see a stable page.
 */
export function LessonRoadmapProvider({ roadmaps, titles, current, children }: { roadmaps: LessonRoadmap[]; titles: Record<string, string>; current: string; children: ReactNode }) {
  // Read after hydration only: the server and the first paint use the first roadmap.
  const last = useSyncExternalStore(noop, lastRoadmap, () => null);
  const roadmap = roadmaps.find((r) => r.id === last) ?? roadmaps[0] ?? null;
  return <RoadmapContext.Provider value={{ roadmap, titles, current }}>{children}</RoadmapContext.Provider>;
}

/** The first link of the breadcrumb: back to the roadmap, where the learner left it. */
export function RoadmapCrumbs() {
  const { roadmap } = useContext(RoadmapContext);
  if (!roadmap)
    return (
      <Link href="/paths" className="underline underline-offset-2">
        Paths
      </Link>
    );
  const back = () => markReturn(roadmap.id);
  if (roadmap.crumbs?.length)
    return (
      <>
        {roadmap.crumbs.map((c, i) => (
          <span key={c.href}>
            {i > 0 && <span> / </span>}
            <Link href={c.href} onClick={i === 0 ? back : undefined} className="underline underline-offset-2">
              {c.label}
            </Link>
          </span>
        ))}
      </>
    );
  return (
    <Link href={roadmap.href} onClick={back} className="underline underline-offset-2">
      ← {roadmap.name} roadmap
    </Link>
  );
}

/** Every lesson on the roadmap, with ticks for the ones done. */
export function RoadmapLessons() {
  const { roadmap, titles, current } = useContext(RoadmapContext);
  if (!roadmap) return null;
  return <PathLessons pathName={roadmap.name} lessons={roadmap.lessons.map((id) => ({ id, title: titles[id] ?? id }))} current={current} />;
}

/** Previous and next topic on the roadmap, and the way back to it. */
export function RoadmapPrevNext() {
  const { roadmap, titles, current } = useContext(RoadmapContext);
  if (!roadmap) return null;
  const at = roadmap.lessons.indexOf(current);
  const prev = at > 0 ? roadmap.lessons[at - 1] : null;
  const next = at >= 0 && at < roadmap.lessons.length - 1 ? roadmap.lessons[at + 1] : null;
  const card = "rounded-2xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900";
  return (
    <nav aria-label={`Lessons on the ${roadmap.name} roadmap`} className="mt-12">
      <div className="grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link href={`/stop/${prev}`} data-no-splash="" className={card}>
            <span className={`block text-sm ${muted}`}>← Previous topic</span>
            <span className="font-medium">{titles[prev]}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/stop/${next}`} data-no-splash="" className={`${card} text-right`}>
            <span className={`block text-sm ${muted}`}>Next topic on this roadmap →</span>
            <span className="font-medium">{titles[next]}</span>
          </Link>
        )}
      </div>
      <p className="mt-3 text-center text-sm">
        <Link href={roadmap.href} onClick={() => markReturn(roadmap.id)} className="inline-flex min-h-11 items-center font-medium text-brand-800 underline-offset-4 hover:underline dark:text-brand-300">
          ← Back to the {roadmap.name} roadmap
        </Link>
      </p>
    </nav>
  );
}
