"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/art/icons";
import { KIND_LABEL, type SearchItem, search } from "@/lib/search/search";

let cache: Promise<SearchItem[]> | null = null;
const loadIndex = () =>
  (cache ??= fetch("/search-index.json")
    .then((r) => (r.ok ? (r.json() as Promise<SearchItem[]>) : []))
    .catch(() => {
      cache = null;
      return [];
    }));

const SUGGESTIONS = ["RAG", "AI agents", "Python", "Prompt engineering", "Interview", "n8n"];

/**
 * Search across roadmaps, topics, lessons, guides, interview questions, the glossary
 * and courses. A combobox: arrow keys move through results, Enter opens one.
 */
export function SearchBox({
  autoFocus = false,
  size = "md",
  onNavigate,
}: {
  autoFocus?: boolean;
  size?: "md" | "lg";
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [items, setItems] = useState<SearchItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => (items ? search(items, query, 10) : []), [items, query]);

  const ensureIndex = () => {
    if (!items) void loadIndex().then(setItems);
  };
  useEffect(() => {
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);

  const go = (item: SearchItem) => {
    setOpen(false);
    onNavigate?.();
    if (item.h.startsWith("/go/")) window.open(item.h, "_blank", "noopener");
    else router.push(item.h);
  };

  const big = size === "lg";
  const showList = open && query.trim().length > 0;

  return (
    <div className="relative w-full">
      <div
        className={`flex items-center gap-3 rounded-2xl border border-zinc-300 bg-white text-zinc-900 shadow-sm focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${big ? "h-14 px-5" : "h-12 px-4"}`}
      >
        <Icon name="search" size={big ? 22 : 18} className="shrink-0 text-zinc-500" />
        <input
          ref={input}
          type="search"
          role="combobox"
          aria-label="Search lessons, roadmaps, questions and courses"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
          value={query}
          placeholder="Search: RAG, agents, Python…"
          onFocus={() => {
            ensureIndex();
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => {
            ensureIndex();
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && results[active]) {
              e.preventDefault();
              go(results[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-zinc-500 ${big ? "text-lg" : "text-base"}`}
        />
        <kbd className="hidden rounded border border-zinc-300 px-1.5 text-xs text-zinc-500 sm:inline dark:border-zinc-600">Ctrl K</kbd>
      </div>
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Search results"
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 text-left text-zinc-900 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {items === null && <li className="px-3 py-2 text-sm text-zinc-500">Loading…</li>}
          {items !== null && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400">Nothing found. Try a shorter word.</li>
          )}
          {results.map((r, i) => (
            <li
              key={`${r.k}-${r.h}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                go(r);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${i === active ? "bg-emerald-50 dark:bg-emerald-950" : ""}`}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{r.t}</span>
                {r.s && <span className="block truncate text-sm text-zinc-600 dark:text-zinc-400">{r.s}</span>}
              </span>
              <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {KIND_LABEL[r.k]}
              </span>
            </li>
          ))}
        </ul>
      )}
      {big && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="opacity-70">Popular:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                ensureIndex();
                setQuery(s);
                setOpen(true);
                input.current?.focus();
              }}
              className="rounded-full border border-current/20 px-3 py-1 hover:bg-white/10"
            >
              {s}
            </button>
          ))}
        </p>
      )}
    </div>
  );
}
