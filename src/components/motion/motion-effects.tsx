"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * MO-3: tilts any element marked data-tilt a few degrees toward the pointer. One listener
 * for the whole site, so server components only add the attribute. Off for touch screens
 * and reduced motion (the CSS ignores the angles there too).
 */
export function MotionEffects() {
  useEffect(() => {
    if (!matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    let current: HTMLElement | null = null;
    let frame = 0;
    const reset = (el: HTMLElement) => {
      el.style.removeProperty("--tilt-x");
      el.style.removeProperty("--tilt-y");
      el.removeAttribute("data-tilting");
    };
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.<HTMLElement>("[data-tilt]") ?? null;
      if (current && current !== el) reset(current);
      current = el;
      if (!el) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const max = Number(el.dataset.tilt) || 6;
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--tilt-x", `${(-y * max).toFixed(2)}deg`);
        el.style.setProperty("--tilt-y", `${(x * max).toFixed(2)}deg`);
        el.setAttribute("data-tilting", "");
      });
    };
    const onLeave = () => {
      if (current) reset(current);
      current = null;
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);
  return null;
}

/** MO-1: replays the page's rise-in each time the route changes (not on the first load). */
export function PageEnter() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = document.getElementById("page");
    if (!el) return;
    el.classList.remove("lx-enter");
    void el.offsetWidth; // restart the animation
    el.classList.add("lx-enter");
    // Cards inside run their own animations; only the page's own end counts.
    const done = (e: AnimationEvent) => {
      if (e.target === el) el.classList.remove("lx-enter");
    };
    el.addEventListener("animationend", done);
    return () => el.removeEventListener("animationend", done);
  }, [pathname]);
  return null;
}
