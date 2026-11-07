"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/art/icons";
import { CopyCode } from "@/components/copy-code";
import { primaryButton, secondaryButton } from "@/components/ui";
import type { Cheatsheet } from "@/lib/content/schema";

/**
 * CS-2: a cheatsheet you can use, not just read. Sections rise into view one after another,
 * "Quiz me" hides every answer so each card is a flashcard, a filter narrows the sheet, and the
 * whole sheet downloads as a PDF. Motion is skipped under prefers-reduced-motion.
 */
export function CheatsheetView({ sheet }: { sheet: Cheatsheet }) {
  const [quiz, setQuiz] = useState(false);
  const [shown, setShown] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [pdf, setPdf] = useState<"idle" | "busy" | "error">("idle");
  const grid = useRef<HTMLDivElement>(null);

  // Reveal each section as it scrolls into view.
  useEffect(() => {
    const els = grid.current?.querySelectorAll<HTMLElement>("[data-cs-section]") ?? [];
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("cs-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add("cs-in");
            io.unobserve(e.target);
          }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  const needle = q.trim().toLowerCase();
  const sections = useMemo(
    () =>
      sheet.sections
        .map((s) => ({ ...s, items: needle ? s.items.filter((i) => `${i.term} ${i.detail} ${i.code ?? ""}`.toLowerCase().includes(needle)) : s.items }))
        .filter((s) => s.items.length > 0),
    [sheet, needle],
  );
  const total = sheet.sections.reduce((n, s) => n + s.items.length, 0);

  const toggle = (key: string) =>
    setShown((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const download = async () => {
    setPdf("busy");
    try {
      const { downloadCheatsheetPdf } = await import("@/lib/cheatsheet-pdf");
      await downloadCheatsheetPdf(sheet);
      setPdf("idle");
    } catch {
      setPdf("error");
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900">
        <label className="flex min-h-11 flex-1 items-center gap-2 rounded-2xl bg-zinc-100 px-3 dark:bg-zinc-800">
          <Icon name="search" size={16} className="text-zinc-500" />
          <span className="sr-only">Filter this cheatsheet</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Filter ${total} items`} className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-zinc-500" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={quiz}
            onClick={() => {
              setQuiz(!quiz);
              setShown(new Set());
            }}
            className={quiz ? primaryButton : secondaryButton}
          >
            <Icon name="target" size={16} /> {quiz ? "Quiz on: tap a card" : "Quiz me"}
          </button>
          <button type="button" onClick={() => void download()} disabled={pdf === "busy"} className={secondaryButton}>
            <Icon name="book" size={16} /> {pdf === "busy" ? "Making the PDF…" : "Download PDF"}
          </button>
        </div>
      </div>
      {pdf === "error" && (
        <p role="alert" className="mt-2 text-sm text-rose-800 dark:text-rose-300">
          The PDF could not be made. Use your browser&apos;s Print and choose &ldquo;Save as PDF&rdquo; instead.
        </p>
      )}
      {quiz && (
        <p role="status" className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Say the answer to yourself, then tap the card to check. {shown.size} of {total} revealed.
        </p>
      )}

      <div ref={grid} className="mt-6 columns-1 gap-5 md:columns-2 xl:columns-3">
        {sections.map((s, si) => (
          <section
            key={s.title}
            data-cs-section
            aria-labelledby={`cs-${si}`}
            style={{ transitionDelay: `${(si % 3) * 80}ms` }}
            className="cs-section mb-5 break-inside-avoid rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 id={`cs-${si}`} className="flex items-center gap-2 text-base font-semibold">
              <span className="grid size-6 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-200">{si + 1}</span>
              {s.title}
            </h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {s.items.map((it) => {
                const key = `${s.title}:${it.term}`;
                const hidden = quiz && !shown.has(key);
                const body = (
                  <>
                    <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">{it.term}</span>
                    {hidden ? (
                      <span className="mt-1 block text-xs font-medium text-violet-800 dark:text-violet-300">Tap to reveal</span>
                    ) : (
                      <span className="cs-reveal block">
                        <span className="mt-0.5 block text-sm leading-6 text-zinc-700 dark:text-zinc-300">{it.detail}</span>
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={key}>
                    {quiz ? (
                      <button type="button" onClick={() => toggle(key)} aria-expanded={!hidden} className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-left transition-colors hover:border-violet-300 dark:border-zinc-700 dark:hover:border-violet-700">
                        {body}
                      </button>
                    ) : (
                      <div className="border-l-2 border-zinc-200 pl-3 dark:border-zinc-700">{body}</div>
                    )}
                    {it.code && !hidden && (
                      <CopyCode>
                        <pre tabIndex={0} className="mt-2 overflow-x-auto rounded-2xl bg-zinc-50 p-3 pr-16 text-xs leading-5 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
                          <code>{it.code}</code>
                        </pre>
                      </CopyCode>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      {sections.length === 0 && <p className="mt-6 text-zinc-600 dark:text-zinc-400">Nothing matches &ldquo;{q}&rdquo;.</p>}
    </div>
  );
}
