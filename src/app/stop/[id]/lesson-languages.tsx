import Link from "next/link";
import { LESSON_LANGS, type LessonLang } from "@/lib/content/schema";

/**
 * LT-1: read this lesson in English or one of its translations. Plain links, so each language has its own address.
 * LT-4: folded into one "Read in" control beside the lesson's facts, so the lesson starts higher on a phone.
 */
export function LessonLanguages({ id, current, available }: { id: string; current: "en" | LessonLang; available: LessonLang[] }) {
  const options = [
    { id: "en" as const, label: "English", href: `/stop/${id}`, lang: "en" },
    ...LESSON_LANGS.filter((l) => available.includes(l.id)).map((l) => ({ id: l.id, label: l.label, href: `/stop/${id}/${l.id}`, lang: l.htmlLang })),
  ];
  const now = options.find((o) => o.id === current) ?? options[0];
  return (
    <nav aria-label="Read this lesson in" className="relative">
      <details className="group">
        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full bg-white px-4 font-medium text-brand-900 [&::-webkit-details-marker]:hidden">
          <span lang="en">Read in</span>
          <span lang={now.lang}>{now.label}</span>
          <span aria-hidden="true" className="transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>
        <ul className="absolute top-full left-0 z-20 mt-2 flex min-w-44 flex-col rounded-2xl bg-white p-1 text-zinc-900 shadow-lg ring-1 ring-black/5 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-white/10">
          {options.map((o) => (
            <li key={o.id}>
              <Link
                href={o.href}
                hrefLang={o.lang}
                lang={o.lang}
                aria-current={o.id === current ? "page" : undefined}
                className="flex min-h-11 items-center rounded-xl px-3 font-medium hover:bg-zinc-100 aria-[current]:text-brand-800 dark:hover:bg-zinc-800 dark:aria-[current]:text-brand-300"
              >
                {o.label}
                {o.id === current && <span className="ml-auto pl-3 text-sm" aria-hidden="true">✓</span>}
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </nav>
  );
}
