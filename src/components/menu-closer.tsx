"use client";

import { useEffect } from "react";

/**
 * The phone menu is a plain <details>, so it works without JavaScript. With JavaScript, a
 * client-side navigation keeps the page (and the open menu) in place, so close it when a link
 * inside is chosen, on back and forward, and on Escape.
 */
export function MenuCloser({ selector }: { selector: string }) {
  useEffect(() => {
    const menu = document.querySelector<HTMLDetailsElement>(selector);
    if (!menu) return;
    const close = () => {
      menu.open = false;
    };
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("a")) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menu.open) {
        close();
        menu.querySelector("summary")?.focus();
      }
    };
    menu.addEventListener("click", onClick);
    window.addEventListener("popstate", close);
    document.addEventListener("keydown", onKey);
    return () => {
      menu.removeEventListener("click", onClick);
      window.removeEventListener("popstate", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [selector]);

  return null;
}
