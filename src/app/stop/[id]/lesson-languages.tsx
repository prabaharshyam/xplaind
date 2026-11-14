import Link from "next/link";
import { LESSON_LANGS, type LessonLang } from "@/lib/content/schema";

/** LT-1: read this lesson in English or one of its translations. Plain links, so each language has its own address. */
export function LessonLanguages({ id, current, available }: { id: string; current: "en" | LessonLang; available: LessonLang[] }) {
  const options = [
    { id: "en" as const, label: "English", href: `/stop/${id}`, lang: "en" },
    ...LESSON_LANGS.filter((l) => available.includes(l.id)).map((l) => ({ id: l.id, label: l.label, href: `/stop/${id}/${l.id}`, lang: l.htmlLang })),
  ];
  return (
    <nav aria-label="Read this lesson in" className="mt-4 flex flex-wrap items-center gap-2 text-sm">
      <span className="text-white/85" lang="en">
        Read in
      </span>
      {options.map((o) => (
        <Link
          key={o.id}
          href={o.href}
          hrefLang={o.lang}
          lang={o.lang}
          aria-current={o.id === current ? "page" : undefined}
          className={`inline-flex min-h-11 items-center rounded-full px-4 font-medium transition-colors ${o.id === current ? "bg-white text-brand-900" : "bg-black/35 text-white hover:bg-black/50"}`}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}
