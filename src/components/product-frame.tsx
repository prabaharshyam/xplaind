import type { ReactNode } from "react";
import { FIELD, type Tone } from "@/lib/tones";

/**
 * UX-14 (2026-11-27, owner: StudyFetch's design language): a tool shown working, not described. A soft field in the
 * tool's colour (UX-13) holds a small app window with the tool's miniature inside. The window floats gently and its
 * rows arrive one after another as it scrolls in (MO-5's lx-deal, MO-7's lx-bob): position only, never the opacity of
 * text, and still under reduced motion. Decorative: the page says in words what the tool does.
 */
export function ProductFrame({ tone, label, children, className = "" }: { tone: Tone; label: string; children: ReactNode; className?: string }) {
  return (
    <div aria-hidden="true" className={`rounded-3xl p-5 md:p-6 ${FIELD[tone]} ${className}`}>
      <div className="lx-bob lx-bob-brief overflow-clip rounded-2xl bg-white shadow-lg shadow-black/5 ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
        <div className="flex items-center gap-1.5 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
          <span className="size-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span className="size-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span className="size-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <span className="ml-2 truncate text-xs text-zinc-600 dark:text-zinc-400">{label}</span>
        </div>
        <div className="p-3">{children}</div>
      </div>
    </div>
  );
}
