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

const THEME: Record<string, string> = Object.fromEntries(THEMES.map((t) => [t.id, t.from]));

/** The role roadmaps as simple cards: the first thing a visitor can act on. */
export function RoleGrid({ roles }: { roles: RoleCard[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {roles.map((r, i) => (
        <li key={r.id}>
          <Link
            href={`/roadmap/${r.id}`}
            className="group flex h-full flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
          >
            <span aria-hidden="true" className="grid size-10 place-items-center rounded-2xl text-white" style={{ background: THEME[r.theme] }}>
              <Icon name={THEMES.find((t) => t.id === r.theme)?.icon ?? "sparkles"} size={20} />
            </span>
            <span className="flex items-baseline gap-2 text-lg font-semibold text-zinc-900 dark:text-white">
              <span aria-hidden="true" className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{i + 1}.</span>
              {r.name}
            </span>
            <span className="text-card text-zinc-700 dark:text-zinc-300">{r.tagline}</span>
            <span className="mt-auto pt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {r.coding} · {r.lessons} lessons
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
        <li key={t.id} className="">
          <Link
            href={`/topics/${t.id}`}
            className="flex min-h-11 items-center gap-2 rounded-full bg-white py-2 pr-4 pl-2 text-sm text-zinc-900 ring-1 ring-zinc-200 hover:ring-zinc-400 focus-visible:outline-2 focus-visible:outline-violet-700 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-violet-900"
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
