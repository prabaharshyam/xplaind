"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * UX-2: a thin violet bar across the top while a new page loads, so a tap always shows a response.
 * It starts on a click on a link to another page of this site and finishes when the address changes.
 */
export function NavProgress() {
  const bar = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const query = useSearchParams()?.toString() ?? "";
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download")) return;
      const to = new URL(a.href, location.href);
      if (to.origin !== location.origin) return;
      if (to.pathname === location.pathname && to.search === location.search) return; // same page or #anchor
      if (to.pathname.startsWith("/go/") || to.pathname.startsWith("/api/")) return;
      const el = bar.current;
      if (!el) return;
      el.dataset.state = "loading";
      // A navigation that never finishes (offline, blocked) should not leave the bar up forever.
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => (el.dataset.state = "done"), 15000);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    const el = bar.current;
    if (el && el.dataset.state === "loading") el.dataset.state = "done";
    window.clearTimeout(timer.current);
  }, [path, query]);

  return <div ref={bar} className="xp-navbar" data-state="idle" aria-hidden="true" />;
}
