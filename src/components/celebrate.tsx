"use client";

import { useEffect } from "react";

const BITS = Array.from({ length: 18 }, (_, i) => i);
const COLORS = ["#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#0ea5e9"];

/** A short burst of confetti and an XP toast. Respects reduced motion; the toast is announced. */
export function Celebrate({ xp, message, onDone }: { xp: number; message: string; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 4500);
    return () => window.clearTimeout(t);
  }, [onDone]);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
      <div aria-hidden="true" className="absolute bottom-10 left-1/2 motion-reduce:hidden">
        {BITS.map((i) => (
          <span
            key={i}
            className="confetti absolute block size-2 rounded-sm"
            style={
              {
                background: COLORS[i % COLORS.length],
                "--dx": `${Math.cos((i / BITS.length) * Math.PI * 2) * (80 + (i % 4) * 30)}px`,
                "--dy": `${-120 - (i % 5) * 30}px`,
                animationDelay: `${(i % 3) * 40}ms`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <p role="status" className="flex items-center gap-3 rounded-full bg-zinc-900 px-5 py-3 text-white shadow-2xl dark:bg-white dark:text-black">
        <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-sm font-bold text-amber-950">+{xp} XP</span>
        {message}
      </p>
    </div>
  );
}
