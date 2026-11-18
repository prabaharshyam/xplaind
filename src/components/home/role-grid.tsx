import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { THEMES, type ThemeId } from "@/lib/themes";

export type RoleCard = {
  id: string;
  name: string;
  tagline: string;
  theme: ThemeId;
  coding: string;
  months: number;
  lessons: number;
};

/** The role roadmaps as simple cards: the first thing a visitor can act on. */
export function RoleGrid({ roles }: { roles: RoleCard[] }) {
  return (
    // SE-13 (2026-11-18, site review: nine tall cards took 2,400 px of a phone): a compact list on phones
    // (icon, name, lessons, arrow), the full cards with the tagline from small tablets up.
    <ul className="grid gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {roles.map((r, i) => (
        <li key={r.id}>
          <Link
            href={`/roadmap/${r.id}`}
            className="group flex h-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 sm:flex-col sm:items-start sm:p-5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
          >
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <Icon name={THEMES.find((t) => t.id === r.theme)?.icon ?? "book"} size={18} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:w-full sm:gap-3">
              <span className="flex items-baseline gap-2 font-semibold text-zinc-900 sm:text-lg dark:text-white">
                <span aria-hidden="true" className="hidden font-mono text-sm font-normal text-zinc-500 tabular-nums sm:inline dark:text-zinc-400">{String(i + 1).padStart(2, "0")}</span>
                {r.name}
              </span>
              <span className="text-card hidden text-zinc-700 sm:block dark:text-zinc-300">{r.tagline}</span>
              <span className="text-sm text-zinc-600 sm:mt-auto sm:pt-1 dark:text-zinc-400">
                {r.coding} · {r.lessons} lessons
              </span>
            </span>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 sm:hidden" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Topic roadmaps: every lesson grouped by subject, for people who want one skill. */
export function TopicChips({ counts }: { counts: Record<string, number> }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {THEMES.filter((t) => counts[t.id]).map((t) => (
        <li key={t.id} className="">
          <Link
            href={`/topics/${t.id}`}
            className="flex min-h-11 items-center gap-2 rounded-full bg-white py-2 pr-4 pl-2 text-sm text-zinc-900 ring-1 ring-zinc-200 hover:ring-zinc-400 focus-visible:outline-2 focus-visible:outline-brand-700 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-brand-900"
          >
            <span aria-hidden="true" className="mx-1 size-2 shrink-0 rounded-full" style={{ background: t.from }} />
            {t.label}
            <span className="text-zinc-600 dark:text-zinc-400">{counts[t.id]}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
