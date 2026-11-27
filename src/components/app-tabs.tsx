"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";

/**
 * DB-1: one thing at a time, the way the prep plan does it (PREP-9): a row of tabs under a line, arrow keys move
 * between them, and every panel stays in the page (hidden) so its state survives a switch.
 */
export function AppTabs({ id, label, tabs }: { id: string; label: string; tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [tab, setTab] = useState(tabs[0].id);
  const onKey = (e: KeyboardEvent) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    const next = tabs[(tabs.findIndex((t) => t.id === tab) + step + tabs.length) % tabs.length].id;
    setTab(next);
    requestAnimationFrame(() => document.getElementById(`${id}-tab-${next}`)?.focus());
  };
  return (
    <div>
      <div role="tablist" aria-label={label} onKeyDown={onKey} className="flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`${id}-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`${id}-panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            className={`min-h-11 shrink-0 border-b-2 px-3 text-sm font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-700 ${
              tab === t.id ? "border-brand-700 text-brand-800 dark:border-brand-300 dark:text-brand-200" : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`${id}-panel-${t.id}`} aria-labelledby={`${id}-tab-${t.id}`} hidden={tab !== t.id} className="flex flex-col gap-8 pt-6">
          {t.content}
        </div>
      ))}
    </div>
  );
}
