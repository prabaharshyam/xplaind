"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/art/icons";
import { useProgress } from "@/lib/browser/hooks";

export type OutlineStage = { id: string; title: string; lessons: { id: string; title: string }[] };

/**
 * RM-15: the course outline beside the lesson (like a docs site): every stage of the path and
 * its lessons, the current one marked, ticks for the ones done on this device.
 * "side" is the sticky left column on big screens; "inline" folds into a dropdown on phones.
 */
export function CourseOutline({ pathName, stages, current, variant }: { pathName: string; stages: OutlineStage[]; current: string; variant: "side" | "inline" }) {
  const { stops } = useProgress();
  const all = stages.flatMap((s) => s.lessons);
  const done = all.filter((l) => stops[l.id]?.status === "done").length;
  const list = useRef<HTMLDivElement>(null);

  // Keep the current lesson in view in the side list.
  useEffect(() => {
    if (variant !== "side") return;
    const el = list.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (el && list.current) list.current.scrollTop = el.offsetTop - list.current.clientHeight / 3;
  }, [variant]);

  const body = (
    <div ref={list} className={variant === "side" ? "min-h-0 flex-1 overflow-y-auto pr-1" : "mt-3 max-h-[60vh] overflow-y-auto pr-1"}>
      {stages.map((st) => (
        <div key={st.id} className="mb-4">
          <p className="px-2 pb-1 text-xs font-semibold tracking-wide text-zinc-600 uppercase dark:text-zinc-400">{st.title}</p>
          <ol className="space-y-0.5 text-sm">
            {st.lessons.map((l) => {
              const isDone = stops[l.id]?.status === "done";
              const here = l.id === current;
              return (
                <li key={l.id}>
                  <Link
                    href={`/stop/${l.id}`}
                    aria-current={here ? "page" : undefined}
                    className={`flex items-start gap-2 rounded-2xl border-l-2 px-2 py-1.5 leading-5 transition-colors ${
                      here
                        ? "border-violet-700 bg-violet-50 font-semibold text-violet-900 dark:border-violet-400 dark:bg-violet-950/50 dark:text-white"
                        : "border-transparent text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full ${isDone ? "bg-emerald-600 text-white" : "border border-zinc-300 dark:border-zinc-600"}`}>
                      {isDone && <Icon name="check" size={10} strokeWidth={3} />}
                    </span>
                    <span>
                      {l.title}
                      {isDone && <span className="sr-only"> (done)</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );

  const head = (
    <span className="block">
      <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">{pathName}</span>
      <span className="mt-0.5 block text-xs font-normal text-zinc-600 dark:text-zinc-400">
        {done} of {all.length} lessons done
      </span>
    </span>
  );
  const bar = (
    <span className="mt-2 block h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800" aria-hidden="true">
      <span className="block h-full bg-emerald-600" style={{ width: `${all.length ? (done / all.length) * 100 : 0}%` }} />
    </span>
  );

  if (variant === "inline")
    return (
      <details className="group rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
          {head}
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0 text-zinc-500 transition group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        {bar}
        {body}
      </details>
    );

  return (
    <nav aria-label={`Lessons on ${pathName}`} className="flex max-h-[calc(100dvh-6rem)] flex-col gap-3">
      <div className="px-2">
        {head}
        {bar}
      </div>
      {body}
    </nav>
  );
}
