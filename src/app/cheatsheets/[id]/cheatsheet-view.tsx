"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/art/icons";
import { CopyCode } from "@/components/copy-code";
import { primaryButton, secondaryButton } from "@/components/ui";
import type { Cheatsheet } from "@/lib/content/schema";

/** Five soft accents, one per section in turn, so the sections tell apart at a glance. */
const ACCENTS = [
  { dot: "bg-violet-600", num: "text-violet-600 dark:text-violet-400", top: "border-t-violet-500" },
  { dot: "bg-teal-600", num: "text-teal-600 dark:text-teal-400", top: "border-t-teal-500" },
  { dot: "bg-amber-600", num: "text-amber-600 dark:text-amber-400", top: "border-t-amber-500" },
  { dot: "bg-rose-600", num: "text-rose-600 dark:text-rose-400", top: "border-t-rose-500" },
  { dot: "bg-sky-600", num: "text-sky-600 dark:text-sky-400", top: "border-t-sky-500" },
] as const;

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

      {/* The map: every section at a glance, each a jump link. */}
      {!needle && sections.length > 1 && (
        <nav aria-label="Sections of this cheatsheet" className="mt-6">
          <ol className="flex flex-wrap gap-2">
            {sections.map((s, si) => (
              <li key={s.title}>
                <a
                  href={`#cs-${si}`}
                  className="flex min-h-11 items-center gap-2 rounded-full border border-zinc-200 bg-white py-1.5 pr-4 pl-1.5 text-sm font-medium hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
                >
                  <span className={`grid size-7 place-items-center rounded-full text-xs font-bold text-white ${ACCENTS[si % ACCENTS.length].dot}`}>{si + 1}</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div ref={grid} className="mt-8 flex flex-col gap-8">
        {sections.map((s, si) => {
          const a = ACCENTS[si % ACCENTS.length];
          const steps = s.layout === "steps";
          const cols = s.items.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";
          const item = (it: (typeof s.items)[number], ii: number) => {
            const key = `${s.title}:${it.term}`;
            const hidden = quiz && !shown.has(key);
            const body = (
              <>
                <span className="block text-base font-semibold text-zinc-900 dark:text-zinc-100">{it.term}</span>
                {hidden ? (
                  <span className="mt-1 block text-sm font-medium text-violet-800 dark:text-violet-300">Tap to reveal</span>
                ) : (
                  <span className="cs-reveal block">
                    <span className="mt-1 block text-sm leading-6 text-zinc-700 dark:text-zinc-300">{it.detail}</span>
                  </span>
                )}
              </>
            );
            const tile = `block w-full rounded-2xl border border-zinc-200 border-t-2 bg-white p-4 text-left dark:border-zinc-800 dark:bg-zinc-900 ${a.top}`;
            const code = it.code && !hidden && (
              <CopyCode>
                <pre tabIndex={0} className="mt-2 overflow-x-auto rounded-2xl bg-zinc-50 p-3 pr-16 text-xs leading-5 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
                  <code>{it.code}</code>
                </pre>
              </CopyCode>
            );
            const inner = quiz ? (
              <button type="button" onClick={() => toggle(key)} aria-expanded={!hidden} className={`${tile} transition-colors hover:border-violet-300 dark:hover:border-violet-700`}>
                {body}
              </button>
            ) : (
              <div className={tile}>{body}</div>
            );
            if (!steps) return <li key={key}>{inner}{code}</li>;
            return (
              <li key={key} className="relative pl-11 lg:pt-11 lg:pl-0">
                <span className={`absolute top-0 left-0 grid size-8 place-items-center rounded-full text-sm font-bold text-white ${a.dot}`}>{ii + 1}</span>
                {ii < s.items.length - 1 && <span aria-hidden="true" className="absolute top-9 -bottom-3 left-4 w-px bg-zinc-300 lg:top-4 lg:right-[-0.75rem] lg:bottom-auto lg:left-10 lg:h-px lg:w-auto dark:bg-zinc-700" />}
                {inner}
                {code}
              </li>
            );
          };
          return (
            <section
              key={s.title}
              data-cs-section
              aria-labelledby={`cs-${si}`}
              style={{ transitionDelay: `${(si % 3) * 80}ms` }}
              className="cs-section scroll-mt-24"
            >
              <h2 id={`cs-${si}`} className="flex items-baseline gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
                <span aria-hidden="true" className={`text-3xl font-semibold tabular-nums ${a.num}`}>
                  {String(si + 1).padStart(2, "0")}
                </span>
                <span className="text-xl font-semibold">{s.title}</span>
                <span className="ml-auto text-sm font-normal text-zinc-600 dark:text-zinc-400">
                  {s.items.length} {steps ? "steps" : "items"}
                </span>
              </h2>
              {steps ? (
                <ol
                  className="mt-5 flex flex-col gap-4 lg:grid lg:gap-x-6 lg:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
                  style={{ "--n": Math.min(s.items.length, 6) } as React.CSSProperties}
                >
                  {s.items.map(item)}
                </ol>
              ) : (
                <ul className={`mt-5 grid gap-3 sm:grid-cols-2 ${cols}`}>{s.items.map(item)}</ul>
              )}
            </section>
          );
        })}
      </div>
      {sections.length === 0 && <p className="mt-6 text-zinc-600 dark:text-zinc-400">Nothing matches &ldquo;{q}&rdquo;.</p>}
    </div>
  );
}
