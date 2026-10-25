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
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {roles.map((r) => (
        <li key={r.id}>
          <Link
            href={`/roadmap/${r.id}`}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            <Cover theme={r.theme} seed={r.id} className="h-20 sm:h-28" iconSize={32} />
            <span className="flex flex-1 flex-col gap-2 p-4">
              <span className="flex items-center justify-between gap-2 text-lg font-semibold text-white">
                {r.name}
                <span aria-hidden="true" className="text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white">
                  →
                </span>
              </span>
              <span className="text-sm leading-6 text-zinc-300">{r.tagline}</span>
              <span className="mt-auto flex flex-wrap gap-2 pt-2 text-xs text-zinc-300">
                <span className="rounded-full bg-white/10 px-2 py-0.5">{r.coding}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5">about {r.months} {r.months === 1 ? "month" : "months"}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5">{r.lessons} lessons</span>
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
        <li key={t.id}>
          <Link
            href={`/topics/${t.id}`}
            className="flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-2 pr-4 pl-2 text-sm text-zinc-100 hover:border-white/30 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            <span className="grid size-7 place-items-center rounded-full text-white" style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}>
              <Icon name={t.icon} size={15} />
            </span>
            {t.label}
            <span className="text-zinc-400">{counts[t.id]}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
