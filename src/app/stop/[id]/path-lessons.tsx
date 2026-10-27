"use client";

import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { useProgress } from "@/lib/browser/hooks";

/** Every lesson on the learner's path, with ticks for the ones done on this device. */
export function PathLessons({ pathName, lessons, current }: { pathName: string; lessons: { id: string; title: string }[]; current: string }) {
  const { stops } = useProgress();
  const done = lessons.filter((l) => stops[l.id]?.status === "done").length;
  return (
    <details className="group mt-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800" open={lessons.length <= 30}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <span>
          Lessons on {pathName}
          <span className="mt-0.5 block text-xs font-normal text-zinc-600 dark:text-zinc-400">
            {done} of {lessons.length} done
          </span>
        </span>
        <span aria-hidden="true" className="transition group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800" aria-hidden="true">
        <div className="h-full bg-emerald-600" style={{ width: `${lessons.length ? (done / lessons.length) * 100 : 0}%` }} />
      </div>
      <ol className="mt-3 max-h-[50vh] space-y-0.5 overflow-y-auto pr-1 text-sm">
        {lessons.map((l, i) => {
          const isDone = stops[l.id]?.status === "done";
          const here = l.id === current;
          return (
            <li key={l.id}>
              <Link
                href={`/stop/${l.id}`}
                aria-current={here ? "page" : undefined}
                className={`flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 ${here ? "bg-zinc-100 font-medium dark:bg-zinc-900" : ""}`}
              >
                <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] ${isDone ? "bg-emerald-600 text-white" : "border border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-400"}`}>
                  {isDone ? <Icon name="check" size={11} strokeWidth={2.5} /> : i + 1}
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
    </details>
  );
}
