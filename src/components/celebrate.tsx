"use client";

import { useEffect } from "react";

const BITS = Array.from({ length: 18 }, (_, i) => i);
const COLORS = ["#0e4a50", "#d9b26a", "#7fd1c7", "#2a9488", "#ead3a1"];

/** A short burst of confetti and a toast. Respects reduced motion; the toast is announced. */
export function Celebrate({ message, onDone }: { message: string; onDone: () => void }) {
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
      <p role="status" className="xp-glass-strong relative z-0 flex items-center gap-3 rounded-full px-5 py-3 font-medium text-zinc-900 dark:text-white">
        {message}
      </p>
    </div>
  );
}
