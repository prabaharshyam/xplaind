"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";

/**
 * A tall section with a sticky stage. While the section scrolls past, it writes
 * its progress (0 to 1) to the CSS variable --p on the stage, once per frame.
 * Everything else is CSS: children use calc(... var(--p, 1) ...), so without
 * JavaScript the scene shows its finished state, and nothing re-renders in React.
 * With reduced motion the variable stays at 1.
 */
export function ScrollScene({
  children,
  className = "",
  stageClassName = "",
  length = 2,
  style,
}: {
  children: ReactNode;
  className?: string;
  stageClassName?: string;
  /** Section height in screen heights. */
  length?: number;
  style?: CSSProperties;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = outer.current;
    const target = stage.current;
    if (!el || !target) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      target.style.setProperty("--p", "1");
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const span = rect.height - innerHeight;
      const p = span <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / span));
      target.style.setProperty("--p", p.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={outer} className={`relative ${className}`} style={{ height: `${length * 100}svh`, ...style }}>
      <div ref={stage} className={`sticky top-0 h-svh overflow-hidden ${stageClassName}`}>
        {children}
      </div>
    </div>
  );
}
