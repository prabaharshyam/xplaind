"use client";

import { useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/art/icons";
import { read, serverSnapshot, subscribe, write } from "@/lib/browser/storage";

type Mark = "knew" | "learnt" | "skipped";
type Card = { q: string; a: string };

const parse = (raw: string | null, n: number): Mark[] => {
  try {
    const v = JSON.parse(raw ?? "[]") as unknown;
    return Array.isArray(v) ? v.filter((m): m is Mark => m === "knew" || m === "learnt" || m === "skipped").slice(0, n) : [];
  } catch {
    return [];
  }
};

/**
 * "Test your understanding": one card at a time. Reveal the answer, then say
 * whether you knew it. With a storage key the marks are kept on this device.
 */
export function Flashcards({ cards, storageKey, title = "Test your understanding" }: { cards: Card[]; storageKey: string | null; title?: string }) {
  const stored = useSyncExternalStore(subscribe, () => (storageKey ? read(storageKey) : null), serverSnapshot);
  const [local, setLocal] = useState<Mark[]>([]);
  const marks = storageKey ? parse(stored, cards.length) : local;
  const [revealed, setRevealed] = useState(false);

  const save = (next: Mark[]) => {
    setRevealed(false);
    if (storageKey) write(storageKey, next.length ? JSON.stringify(next) : null);
    else setLocal(next);
  };

  const i = marks.length;
  const finished = i >= cards.length;
  const count = (m: Mark) => marks.filter((x) => x === m).length;
  const card = cards[Math.min(i, cards.length - 1)];

  return (
    <section aria-labelledby="flashcards-h" className="rounded-3xl border border-zinc-200 bg-white p-5 md:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="flashcards-h" className="flex items-center gap-2 text-xl font-semibold">
          <Icon name="check" size={20} /> {title}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
          {Math.min(i, cards.length)} of {cards.length}
        </p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800" aria-hidden="true">
        <div className="h-full bg-emerald-600 transition-all" style={{ width: `${(Math.min(i, cards.length) / cards.length) * 100}%` }} />
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        {(
          [
            ["Knew", "knew", "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"],
            ["Learnt", "learnt", "bg-sky-50 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200"],
            ["Skipped", "skipped", "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"],
          ] as const
        ).map(([label, m, cls]) => (
          <div key={m} className={`rounded-xl px-2 py-2 ${cls}`}>
            <dt>{label}</dt>
            <dd className="text-lg font-semibold">{count(m)}</dd>
          </div>
        ))}
      </dl>

      {finished ? (
        <div className="mt-5 rounded-2xl bg-emerald-50 p-5 text-center dark:bg-emerald-950/40" role="status">
          <p className="text-lg font-semibold">All {cards.length} cards done</p>
          <p className="mt-1 text-zinc-700 dark:text-zinc-300">
            You knew {count("knew")}, learnt {count("learnt")} and skipped {count("skipped")}.
          </p>
          <button type="button" onClick={() => save([])} className="mt-4 min-h-11 rounded-full border border-zinc-300 bg-white px-5 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800">
            Start again
          </button>
        </div>
      ) : (
        <div className="mt-5">
          <div className="flex min-h-44 flex-col justify-center rounded-2xl border-2 border-dashed border-zinc-300 p-5 text-center dark:border-zinc-700">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Question {i + 1}</p>
            <p className="mt-2 text-lg leading-7 font-medium">{card.q}</p>
            {revealed ? (
              <p className="mt-4 rounded-xl bg-zinc-50 p-4 text-left leading-7 dark:bg-zinc-950">{card.a}</p>
            ) : (
              <button type="button" onClick={() => setRevealed(true)} className="mx-auto mt-4 min-h-11 rounded-full bg-zinc-900 px-5 font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
                Reveal the answer
              </button>
            )}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <button type="button" onClick={() => save([...marks, "knew"])} className="min-h-11 rounded-xl border border-emerald-300 px-3 text-sm font-medium hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950">
              Already knew that
            </button>
            <button type="button" onClick={() => save([...marks, "learnt"])} className="min-h-11 rounded-xl border border-sky-300 px-3 text-sm font-medium hover:bg-sky-50 dark:border-sky-800 dark:hover:bg-sky-950">
              Didn&apos;t know that
            </button>
            <button type="button" onClick={() => save([...marks, "skipped"])} className="min-h-11 rounded-xl border border-zinc-300 px-3 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
              Skip question
            </button>
          </div>
          {marks.length > 0 && (
            <button type="button" onClick={() => save([])} className="mt-3 text-sm underline underline-offset-2">
              Reset
            </button>
          )}
        </div>
      )}
    </section>
  );
}
