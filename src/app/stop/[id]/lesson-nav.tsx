"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/art/icons";
import type { IconName } from "@/lib/themes";

export type SectionLink = { id: string; title: string; icon: IconName };

/**
 * "On this page", with a tick for each section the learner has scrolled through
 * and a reading bar. Desktop: a sticky side panel. Phone: a slim bar under the header.
 */
export function LessonNav({ sections }: { sections: SectionLink[] }) {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          setCurrent(e.target.id);
          setSeen((prev) => (prev.has(e.target.id) ? prev : new Set(prev).add(e.target.id)));
        }
      },
      { rootMargin: "-30% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  const percent = sections.length ? Math.round((seen.size / sections.length) * 100) : 0;

  return (
    <>
      <div className="sticky top-14 z-30 -mx-4 h-1 bg-zinc-200 lg:hidden dark:bg-zinc-800" aria-hidden="true">
        <div className="h-full bg-emerald-600 transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>
      <nav aria-label="On this page" className="hidden lg:block lg:h-full lg:pt-10">
        <div className="sticky top-20 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm font-semibold">On this page</p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            {seen.size} of {sections.length} sections read
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800" aria-hidden="true">
            <div className="h-full bg-emerald-600 transition-[width] duration-500" style={{ width: `${percent}%` }} />
          </div>
          <ol className="mt-3 flex flex-col gap-1 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  aria-current={current === s.id ? "location" : undefined}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 ${current === s.id ? "bg-zinc-100 font-medium dark:bg-zinc-900" : ""}`}
                >
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-full ${seen.has(s.id) ? "bg-emerald-600 text-white" : "border border-zinc-300 text-zinc-500 dark:border-zinc-600"}`}
                  >
                    {seen.has(s.id) ? <Icon name="check" size={11} strokeWidth={2.5} /> : <Icon name={s.icon} size={11} />}
                  </span>
                  {s.title}
                  {seen.has(s.id) && <span className="sr-only"> (read)</span>}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </nav>
    </>
  );
}
