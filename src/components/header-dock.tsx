"use client";

import { useEffect } from "react";

/**
 * UX-25 (2026-11-27, owner: "the menu bar animation as on studyfetch.com: when we scroll down, both ends of the menu
 * go to the far sides"): past the first few pixels of scroll the floating capsule docks to the top as a full-width
 * bar, and floats again at the top of the page. This only sets data-docked on the header; globals.css animates it.
 */
export function HeaderDock() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      header.toggleAttribute("data-docked", window.scrollY > 16);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
