import Link from "next/link";
import { LESSON_LANGS, type LessonLang } from "@/lib/content/schema";
import { labelLang } from "@/lib/label-lang";

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
    // The header clips what overflows it, so the list opens in the flow, on a row of its own, not as an overlay.
    <nav aria-label="Read this lesson in" className="has-[details[open]]:basis-full">
      <details className="group">
        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full bg-white px-4 font-medium text-brand-900 [&::-webkit-details-marker]:hidden">
          <span lang="en">Read in</span>
          <span lang={labelLang(now.lang)}>{now.label}</span>
          <span aria-hidden="true" className="transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>
        <ul className="mt-2 flex flex-wrap gap-2">
          {options.map((o) => (
            <li key={o.id}>
              <Link
                href={o.href}
                hrefLang={o.lang}
                lang={labelLang(o.lang)}
                aria-current={o.id === current ? "page" : undefined}
                className="inline-flex min-h-11 items-center rounded-full bg-black/35 px-4 font-medium text-white hover:bg-black/50 aria-[current]:bg-white aria-[current]:text-brand-900"
              >
                {o.label}
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </nav>
  );
}
