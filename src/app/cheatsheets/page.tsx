import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/art/icons";
import { PageHero } from "@/components/page-hero";
import { getCheatsheets } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import { themeOf } from "@/lib/themes";

export const metadata: Metadata = pageMeta({
  title: "AI cheatsheets: RAG, prompts, evals, agents, SQL and more",
  description: "One-page interactive cheatsheets for AI interviews and work: RAG, prompt engineering, evals, agents, LLM system design, Python, SQL, Git and more. Quiz yourself or download as PDF.",
  path: "/cheatsheets",
});

/** CS-1: every cheatsheet, as cards. */
export default function CheatsheetsPage() {
  const sheets = getCheatsheets();
  return (
    <main>
      <PageHero
        theme="evals"
        seed="cheatsheets"
        icon="book"
        eyebrow="Practice"
        title="Cheatsheets"
        lead="One page per topic: the terms, numbers and patterns interviews expect. Quiz yourself on any sheet, or download it as a PDF to revise offline."
        crumbs={[{ href: "/practice", label: "Practice" }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sheets.map((s) => {
            const t = themeOf(s.theme);
            const items = s.sections.reduce((n, sec) => n + sec.items.length, 0);
            return (
              <li key={s.id}>
                <Link
                  href={`/cheatsheets/${s.id}`}
                  className="group flex h-full flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.03] transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="grid size-11 place-items-center rounded-2xl text-white" style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}>
                    <Icon name={t.icon} size={22} />
                  </span>
                  <span className="text-lg font-semibold">{s.title}</span>
                  <span className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">{s.summary}</span>
                  <span className="mt-auto text-sm text-zinc-600 dark:text-zinc-400">
                    {s.sections.length} sections · {items} items
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
