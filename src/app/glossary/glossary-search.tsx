"use client";
// SE-10 (2026-11-18, site review: 352 terms on one long page with no search): filters the terms on the
// page as the learner types. It only hides entries the server already rendered, so every term is there
// for search engines and without JavaScript.
import { useId, useState } from "react";

/** Hides the entries that do not match and returns how many are left. */
function filter(q: string): number {
  const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  let n = 0;
  document.querySelectorAll<HTMLElement>("[data-glossary-term]").forEach((el) => {
    const hit = words.every((w) => (el.dataset.glossaryTerm ?? "").includes(w));
    el.hidden = !hit;
    if (hit) n++;
  });
  document.querySelectorAll<HTMLElement>("[data-glossary-letter]").forEach((s) => {
    s.hidden = !s.querySelector("[data-glossary-term]:not([hidden])");
  });
  document.querySelectorAll<HTMLElement>("[data-glossary-letters]").forEach((nav) => (nav.hidden = words.length > 0));
  return n;
}

export function GlossarySearch({ total }: { total: number }) {
  const id = useId();
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(total);



  return (
    <div className="sticky top-16 z-20 -mx-4 bg-[var(--background)]/90 px-4 py-3 backdrop-blur md:top-[4.25rem]">
      <label htmlFor={id} className="sr-only">
        Search the glossary
      </label>
      <input
        id={id}
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setShown(filter(e.target.value));
        }}
        placeholder={`Search ${total} terms: RAG, embedding, agent…`}
        autoComplete="off"
        className="h-12 w-full rounded-full border border-black/15 bg-white px-5 text-base placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:border-white/15 dark:bg-zinc-900"
      />
      <p aria-live="polite" className="mt-2 px-2 text-sm text-zinc-600 dark:text-zinc-400">
        {q.trim() ? (shown ? `${shown} ${shown === 1 ? "term" : "terms"} match` : "No term matches. Try a shorter word, or ask the AI tutor.") : ""}
      </p>
    </div>
  );
}
