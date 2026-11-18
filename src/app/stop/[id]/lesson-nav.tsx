"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/art/icons";
import type { IconName } from "@/lib/themes";

export type SectionLink = { id: string; title: string; icon: IconName };

/**
 * RM-15: "On this page", sticky in the LEFT column on big screens (owner request, 7 Nov 2026), so a
 * learner jumps straight to a section instead of scrolling. Every section the learner has reached or scrolled
 * past gets a tick. Phone: a slim reading bar under the header.
 */
export function LessonNav({ sections }: { sections: SectionLink[] }) {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    // A section counts as read once the learner has scrolled to or past it, so every section above the
    // reading line is ticked, even when they jumped or scrolled fast. (Watching only the sections on
    // screen missed any that went by between two frames.) A tick is never taken back.
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.5;
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let now: string | null = null;
      const passed: string[] = [];
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        if (atEnd || el.getBoundingClientRect().top <= line) {
          passed.push(s.id);
          now = s.id;
        }
      }
      if (now) setCurrent(now);
      setSeen((prev) => (passed.every((id) => prev.has(id)) ? prev : new Set([...prev, ...passed])));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [sections]);

  const percent = sections.length ? Math.round((seen.size / sections.length) * 100) : 0;

  return (
    <>
      <div className="sticky top-16 md:top-[4.25rem] z-30 -mx-4 h-1 bg-zinc-200 lg:hidden dark:bg-zinc-800" aria-hidden="true">
        <div className="h-full bg-emerald-600 transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>
      <div className="hidden lg:block lg:h-full lg:pt-10">
        <div className="sticky top-20 flex max-h-[calc(100dvh-6rem)] flex-col gap-4 overflow-y-auto pb-4">
          <nav aria-label="On this page" className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
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
                    className={`flex items-center gap-2 rounded-2xl px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 ${current === s.id ? "bg-zinc-100 font-medium dark:bg-zinc-900" : ""}`}
                  >
                    <span
                      className={`grid size-5 shrink-0 place-items-center rounded-full ${seen.has(s.id) ? "bg-emerald-600 text-white" : "border border-zinc-300 text-zinc-600 dark:text-zinc-400 dark:border-zinc-600"}`}
                    >
                      {seen.has(s.id) ? <Icon name="check" size={11} strokeWidth={2.5} /> : <Icon name={s.icon} size={11} />}
                    </span>
                    {s.title}
                    {seen.has(s.id) && <span className="sr-only"> (read)</span>}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>
    </>
  );
}
