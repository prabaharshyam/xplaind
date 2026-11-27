import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { NAV_GROUPS } from "@/lib/nav";
import { TILE } from "@/lib/tones";

/** The tools a learner moves between, taken from the menu so the two never disagree. */
const TOOLS = ["/ai/book", "/ai/tutor", "/interview/simulator", "/interview/prep", "/interview", "/ai/resume", "/plan", "/playground"];

/**
 * UX-17 (2026-11-27, owner: StudyFetch's design language): at the foot of every tool page, the other tools as a dark
 * band of tiles in their own colours (UX-13), so a learner moves on to the next tool instead of back to the menu.
 */
export function ExploreTools({ current }: { current: string }) {
  const items = NAV_GROUPS.flatMap((g) => g.items).filter((i) => TOOLS.includes(i.href) && i.href !== current);
  items.sort((a, b) => TOOLS.indexOf(a.href) - TOOLS.indexOf(b.href));
  return (
    <section aria-labelledby="explore-tools-h" className="bg-brand-950 py-14 text-white md:py-20 dark:bg-brand-800">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <h2 id="explore-tools-h" className="text-2xl font-semibold tracking-tight md:text-3xl">
          Explore more tools
        </h2>
        <ul className="lx-deal mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                className="flex h-full items-start gap-3 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10 transition hover:bg-white/[0.1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300 motion-safe:hover:-translate-y-0.5"
              >
                <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-2xl ${TILE[i.tone]}`}>
                  <Icon name={i.icon} size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{i.label}</span>
                  <span className="mt-0.5 block text-sm leading-5 text-brand-100">{i.note}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
