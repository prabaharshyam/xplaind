import Link from "next/link";
import { bookHref } from "@/lib/books";
import type { Book } from "@/lib/content/schema";
import { getLevel } from "@/lib/content";
import { textLink } from "./ui";
import { levelText } from "@/lib/levels";

/** A cover made from the title, so no publisher artwork is copied. */
function Spine({ book }: { book: Book }) {
  const hue = [...book.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  return (
    <div
      aria-hidden="true"
      className="flex h-28 w-20 shrink-0 flex-col justify-between rounded-r-md rounded-l-sm p-2 text-white ring-1 ring-black/10"
      style={{ background: `linear-gradient(160deg, hsl(${hue} 55% 38%), hsl(${(hue + 40) % 360} 60% 24%))` }}
    >
      <span className="line-clamp-4 text-[10px] leading-tight font-semibold">{book.title}</span>
      <span className="truncate text-[9px] opacity-80">{book.author.split(/,| and /)[0]}</span>
    </div>
  );
}

/**
 * BK-1 and BK-2: one book, why it is worth reading, and a buy link that always says it
 * is an affiliate link. `compact` is the smaller version used on lesson pages.
 */
export function BookCard({ book, compact = false }: { book: Book; compact?: boolean }) {
  const level = getLevel(book.level);
  return (
    <article className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
      <Spine book={book} />
      <div className="min-w-0 flex-1">
        <h3 className={`${compact ? "text-base" : "text-lg"} leading-snug font-semibold`}>{book.title}</h3>
        <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
          {book.author} · {book.year} · {levelText(book.level)} {level?.name}
        </p>
        <p className={`mt-2 ${compact ? "text-sm leading-6" : "leading-7"}`}>{book.why}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <a
            href={bookHref(book)}
            target="_blank"
            rel="sponsored noopener"
            className="inline-flex min-h-11 items-center rounded-full bg-amber-500 px-4 text-sm font-semibold text-zinc-950 hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
          >
            See it on Amazon India<span className="sr-only">: {book.title} (affiliate link, opens in a new tab)</span>
          </a>
          {book.hosted_pdf_url && (
            <a href={book.hosted_pdf_url} target="_blank" rel="noopener" className={`text-sm ${textLink}`}>
              Read it free<span className="sr-only">: {book.title}, shared by {book.hosted_by} (opens in a new tab)</span>
            </a>
          )}
        </div>
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
          Affiliate link: we may earn a commission, at no extra cost to you.{" "}
          <Link href="/disclosure" className={textLink}>
            Disclosure
          </Link>
        </p>
      </div>
    </article>
  );
}
