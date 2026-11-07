import type { Testimonial } from "@/lib/content/schema";

/** SO-1: what early users said, in their own words. Shown only when there are real ones. */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-10 columns-1 gap-5 md:columns-2 lg:columns-3" data-rise-group>
      {items.map((t) => (
        <li key={t.name} data-rise className="mb-5 break-inside-avoid">
          <figure className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-950/[0.03] dark:border-zinc-800 dark:bg-zinc-900">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7 text-violet-300 dark:text-violet-700" fill="currentColor">
              <path d="M9.5 5C6 6.4 4 9.2 4 13v6h6v-6H7c0-2.5 1.2-4.3 3.4-5.3L9.5 5Zm10 0C16 6.4 14 9.2 14 13v6h6v-6h-3c0-2.5 1.2-4.3 3.4-5.3L19.5 5Z" />
            </svg>
            <blockquote className="mt-3 leading-7 text-zinc-800 dark:text-zinc-200">{t.quote}</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-violet-100 font-semibold text-violet-800 dark:bg-violet-950 dark:text-violet-200">
                {t.name.charAt(0)}
              </span>
              <span>
                <span className="block font-semibold">{t.name}</span>
                <span className="block text-sm text-zinc-600 dark:text-zinc-400">{t.role}</span>
              </span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
