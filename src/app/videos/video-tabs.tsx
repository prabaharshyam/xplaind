"use client";

import { type ReactNode, useEffect, useState } from "react";

type Tab = { id: string; label: string; count: number; panel: ReactNode };

/** VD-2: Videos and Video courses on one page. The address hash (#courses) opens a tab directly. */
export function VideoTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (tabs.some((t) => t.id === id)) setActive(id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);
  const choose = (id: string) => {
    setActive(id);
    history.replaceState(null, "", id === tabs[0].id ? window.location.pathname : `#${id}`);
  };
  const move = (from: number, step: number) => {
    const next = tabs[(from + step + tabs.length) % tabs.length];
    choose(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };

  return (
    <>
      <div role="tablist" aria-label="What to watch" className="mb-6 flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((t, i) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls={`panel-${t.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => choose(t.id)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") move(i, 1);
                if (e.key === "ArrowLeft") move(i, -1);
              }}
              className={`-mb-px min-h-11 border-b-2 px-3 text-sm font-medium ${
                on ? "border-violet-700 text-zinc-900 dark:border-violet-400 dark:text-white" : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              {t.label} <span className="text-zinc-600 dark:text-zinc-400">{t.count}</span>
            </button>
          );
        })}
      </div>
      {/* Only the open tab is in the page, so each tab's search box and counts are the only ones on screen. */}
      {tabs
        .filter((t) => t.id === active)
        .map((t) => (
          <div key={t.id} id={`panel-${t.id}`} role="tabpanel" aria-labelledby={`tab-${t.id}`}>
            {t.panel}
          </div>
        ))}
    </>
  );
}
