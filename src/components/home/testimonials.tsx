"use client";

import { useRef, useState } from "react";
import type { Testimonial } from "@/lib/content/schema";

/**
 * SO-1: what early users said, in their own words. Shown only when there are real ones.
 * A row you scroll sideways: the card shows a short excerpt (their exact words, with an ellipsis
 * where a part is left out) and "Read more" opens the whole quote. No autoplay: the person
 * decides when to move, with the arrows, a swipe, or the keyboard.
 */
export function Testimonials({ items }: { items: Testimonial[] }) {
  const row = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  if (items.length === 0) return null;

  const move = (dir: 1 | -1) => {
    const el = row.current;
    if (!el) return;
    const step = (el.querySelector("li")?.clientWidth ?? 320) + 20;
    el.scrollBy({ left: dir * step, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  const toggle = (name: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const arrow =
    "grid size-11 place-items-center rounded-full border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";

  return (
    <div className="mt-8">
      <div className="mb-3 hidden justify-end gap-2 sm:flex">
        <button type="button" onClick={() => move(-1)} aria-label="Previous testimonials" className={arrow}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 6-6 6 6 6" />
          </svg>
        </button>
        <button type="button" onClick={() => move(1)} aria-label="Next testimonials" className={arrow}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      </div>
      <ul
        ref={row}
        tabIndex={0}
        aria-label="Testimonials, scroll sideways"
        className="relative -mx-4 flex snap-x snap-mandatory items-start gap-5 overflow-x-auto scroll-smooth px-4 pb-4 [scrollbar-width:thin] md:-mx-6 md:px-6 motion-reduce:scroll-auto"
      >
        {items.map((t) => {
          const full = open.has(t.name);
          const short = t.excerpt && t.excerpt !== t.quote;
          return (
            <li key={t.name} className="w-[82%] max-w-[22rem] shrink-0 snap-start sm:w-[22rem]">
              <figure className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 text-zinc-300 dark:text-zinc-700" fill="currentColor">
                  <path d="M9.5 5C6 6.4 4 9.2 4 13v6h6v-6H7c0-2.5 1.2-4.3 3.4-5.3L9.5 5Zm10 0C16 6.4 14 9.2 14 13v6h6v-6h-3c0-2.5 1.2-4.3 3.4-5.3L19.5 5Z" />
                </svg>
                <blockquote className="mt-3 leading-7 text-zinc-800 dark:text-zinc-200">{full || !short ? t.quote : t.excerpt}</blockquote>
                {short && (
                  <button
                    type="button"
                    aria-expanded={full}
                    onClick={() => toggle(t.name)}
                    className="mt-2 min-h-11 text-sm font-medium text-violet-800 underline underline-offset-4 dark:text-violet-300"
                  >
                    {full ? "Show less" : "Read more"}
                    <span className="sr-only"> from {t.name}</span>
                  </button>
                )}
                <figcaption className="mt-3 flex items-center gap-3">
                  <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-zinc-100 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                    {t.name.charAt(0)}
                  </span>
                  <span>
                    <span className="block font-semibold">{t.name}</span>
                    <span className="block text-sm text-zinc-600 dark:text-zinc-400">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
