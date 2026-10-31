import Link from "next/link";
import { Cover } from "@/components/art/cover";
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

/** The nine role roadmaps as picture cards: the first thing a visitor can act on. */
export function RoleGrid({ roles }: { roles: RoleCard[] }) {
  return (
    <ul className="lx-deal grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {roles.map((r, i) => (
        <li key={r.id}>
          <Link data-tilt
            href={`/roadmap/${r.id}`}
            className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white/80 shadow-sm ring-1 ring-violet-100 backdrop-blur transition hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-200/60 hover:ring-violet-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 dark:bg-white/5 dark:ring-violet-900 dark:hover:shadow-none"
          >
            <Cover theme={r.theme} seed={r.id} className="h-20 sm:h-28" iconSize={32} />
            <span className="flex flex-1 flex-col gap-2 p-4">
              <span className="flex items-center justify-between gap-2 text-lg font-semibold text-zinc-900 dark:text-white">
                <span className="flex items-baseline gap-2">
                  <span aria-hidden="true" className="text-sm font-medium text-violet-700 dark:text-violet-300">{i + 1}.</span>
                  {r.name}
                </span>
                <span aria-hidden="true" className="text-violet-400 transition group-hover:translate-x-0.5 group-hover:text-violet-700">
                  →
                </span>
              </span>
              <span className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">{r.tagline}</span>
              <span className="mt-auto flex flex-wrap gap-2 pt-2 text-xs text-violet-950 dark:text-violet-100">
                <span className="rounded-full bg-violet-100/80 px-2 py-0.5 dark:bg-violet-900/50">{r.coding}</span>
                <span className="rounded-full bg-violet-100/80 px-2 py-0.5 dark:bg-violet-900/50">about {r.months} {r.months === 1 ? "month" : "months"}</span>
                <span className="rounded-full bg-violet-100/80 px-2 py-0.5 dark:bg-violet-900/50">{r.lessons} lessons</span>
              </span>
            </span>
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
        <li key={t.id} className="lx-rise">
          <Link data-tilt
            href={`/topics/${t.id}`}
            className="flex min-h-11 items-center gap-2 rounded-full bg-white/80 py-2 pr-4 pl-2 text-sm text-zinc-900 shadow-sm ring-1 ring-violet-100 backdrop-blur hover:ring-violet-300 focus-visible:outline-2 focus-visible:outline-violet-700 dark:bg-white/5 dark:text-zinc-100 dark:ring-violet-900"
          >
            <span className="grid size-7 place-items-center rounded-full text-white" style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}>
              <Icon name={t.icon} size={15} />
            </span>
            {t.label}
            <span className="text-zinc-600 dark:text-zinc-400">{counts[t.id]}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
