"use client";

import Link from "next/link";
import { useState } from "react";
import { labelLang } from "@/lib/label-lang";

export type LanguageCard = { id: string; label: string; htmlLang: string; q: string; a: string; href: string; lessons: number };

/**
 * LT-5: the same real question and answer, one language at a time. A row of language buttons switches the
 * card in place, so the section is one card tall on a phone instead of five.
 */
export function LanguageSample({ cards }: { cards: LanguageCard[] }) {
  const [at, setAt] = useState(1); // open on the first translation: the point of the section
  const c = cards[at] ?? cards[0];
  return (
    <div>
      <div role="group" aria-label="Show the answer in" className="flex flex-wrap gap-2">
        {cards.map((x, i) => (
          <button
            key={x.id}
            type="button"
            lang={labelLang(x.htmlLang)}
            aria-pressed={i === at}
            onClick={() => setAt(i)}
            className="inline-flex min-h-11 items-center rounded-full bg-zinc-100 px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-200 aria-pressed:bg-brand-800 aria-pressed:text-white dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:aria-pressed:bg-brand-300 dark:aria-pressed:text-brand-950"
          >
            {x.label}
          </button>
        ))}
      </div>
      <div aria-live="polite" className="mt-5 rounded-3xl bg-zinc-50 p-6 md:p-8 dark:bg-zinc-900">
        <p lang={c.htmlLang} className="text-xl leading-8 font-semibold tracking-tight">
          {c.q}
        </p>
        <p lang={c.htmlLang} className="mt-3 text-lg leading-8 text-zinc-800 dark:text-zinc-200">
          {c.a}
        </p>
        <Link href={c.href} hrefLang={c.htmlLang} className="mt-5 inline-flex min-h-11 items-center gap-1 font-medium text-brand-800 underline-offset-4 hover:underline dark:text-brand-300">
          Read all {c.lessons} lessons in <span lang={labelLang(c.htmlLang)}>{c.label}</span> <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
