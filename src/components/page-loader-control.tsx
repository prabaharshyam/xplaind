"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { NAVIGATE_EVENT, isPageChangeLink } from "@/lib/nav-feedback";

/** The screen stays up at least this long once the page is ready, so the animation reads as intended, not as a flash. */
const BOOT_MIN_MS = 450;
/** A page change faster than this never shows the screen at all (the CSS also waits before fading it in). */
const QUICK_MS = 200;
/** Once shown, a page change keeps it up at least this long. */
const NAV_MIN_MS = 600;
/** If a page change never finishes (offline, blocked), do not leave the screen up. */
const GIVE_UP_MS = 15000;

/**
 * UX-7: drives the loading screen (PageLoader) by setting its data-state: "boot" until the page is
 * ready, "nav" while another page loads, "idle" when hidden. It starts on a click on a link to
 * another page of this site (so a language switch counts) or when code announces a navigation,
 * and ends when the address changes.
 */
export function PageLoaderControl() {
  const path = usePathname();
  const query = useSearchParams()?.toString() ?? "";
  const started = useRef(0);
  const timers = useRef<number[]>([]);

  const el = () => document.getElementById("xp-splash");
  const say = (text: string) => {
    const s = document.getElementById("xp-splash-status");
    if (s) s.textContent = text;
  };
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  };
  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  // The first load: the page is ready, so hide the screen after its minimum time.
  useEffect(() => {
    const node = el();
    if (!node) return;
    later(() => {
      node.dataset.state = "idle";
    }, BOOT_MIN_MS);
    return clear;
  }, []);

  // Another page is loading: show the screen.
  useEffect(() => {
    const begin = () => {
      const node = el();
      if (!node) return;
      clear();
      started.current = Date.now();
      node.dataset.state = "nav";
      say("Loading");
      later(() => {
        node.dataset.state = "idle";
        say("");
      }, GIVE_UP_MS);
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (a && isPageChangeLink(a, location)) begin();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener(NAVIGATE_EVENT, begin);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(NAVIGATE_EVENT, begin);
    };
  }, []);

  // The address changed: the new page is here, so hide the screen (after its minimum time, if it was shown).
  useEffect(() => {
    const node = el();
    if (!node || node.dataset.state !== "nav") return;
    clear();
    const elapsed = Date.now() - started.current;
    const wait = elapsed < QUICK_MS ? 0 : Math.max(0, NAV_MIN_MS - elapsed);
    later(() => {
      node.dataset.state = "idle";
      say("");
    }, wait);
  }, [path, query]);

  return null;
}
