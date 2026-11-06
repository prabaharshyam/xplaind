"use client";

import { useEffect, useState } from "react";
import { THEME_KEY, type Theme, currentTheme, setTheme } from "@/lib/browser/theme";

/** BR-6: the light/dark switch in the header. Remembers the choice on this device. */
export function ThemeToggle({ className = "", labelled = false }: { className?: string; labelled?: boolean }) {
  const [theme, setState] = useState<Theme | null>(null);

  useEffect(() => {
    queueMicrotask(() => setState(currentTheme()));
    // With no saved choice, keep following the system setting as it changes.
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => {
      try {
        if (localStorage.getItem(THEME_KEY)) return;
      } catch {}
      document.documentElement.dataset.theme = media.matches ? "dark" : "light";
      setState(currentTheme());
    };
    media.addEventListener("change", onSystem);
    return () => media.removeEventListener("change", onSystem);
  }, []);

  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => {
        setTheme(next);
        setState(next);
      }}
      aria-label={theme ? `Switch to ${next} mode` : "Switch light or dark mode"}
      className={
        labelled
          ? `flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-base font-medium text-zinc-900 hover:bg-violet-50 dark:text-zinc-100 dark:hover:bg-white/5 ${className}`
          : `grid size-10 shrink-0 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 ${className}`
      }
    >
      {/* Moon in light mode, sun in dark mode: the icon shows where the switch takes you. */}
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 dark:hidden" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
      </svg>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="hidden size-5 dark:block" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      {labelled && (
        <span aria-hidden="true">
          <span className="dark:hidden">Dark mode</span>
          <span className="hidden dark:inline">Light mode</span>
        </span>
      )}
    </button>
  );
}
