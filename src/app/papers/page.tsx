import { PageHero } from "@/components/page-hero";
import { getLevel } from "@/lib/content";
import { getLibrary } from "@/lib/content/papers";
import { pageMeta } from "@/lib/seo";
import { THEMES } from "@/lib/themes";
import { DownloadLink } from "./download-link";

export const metadata = pageMeta({
  title: "AI research papers and free AI books (PDF)",
  description:
    "The papers that built modern AI, from Attention Is All You Need to DeepSeek-R1, and free AI books shared by their authors, each with a plain-English line on why to read it.",
  path: "/papers",
});

/** LB-1, LB-2: landmark papers and free books, grouped by topic; downloads need a free account. */
export default function PapersPage() {
  const items = getLibrary();
  const books = items.filter((i) => i.kind === "book").sort((a, b) => a.title.localeCompare(b.title));
  const papers = items.filter((i) => i.kind === "paper");
  const groups = THEMES.map((t) => ({ theme: t, items: papers.filter((p) => p.theme === t.id).sort((a, b) => a.year - b.year) })).filter((g) => g.items.length);
  const sections = [...groups.map((g) => ({ id: g.theme.id, label: `Papers: ${g.theme.label}`, items: g.items })), { id: "free-books", label: "Free books", items: books }];

  return (
    <main>
      <PageHero shape="paperStack"
        theme="llm"
        seed="papers"
        icon="book"
        eyebrow="Library"
        title="Research papers and free AI books"
        lead={`${papers.length} papers that built modern AI and ${books.length} free books, each with one plain line on why it matters. Downloads come with your account.`}
      />
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <p className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 dark:border-zinc-800 dark:bg-zinc-900">
          We link only to copies the authors or publishers share themselves, such as arXiv or the book&apos;s own site, and say who hosts
          each one. New to papers? Start with Attention Is All You Need, read the figures and the conclusion first, then the method.
        </p>
        <nav aria-label="Library sections" className="mt-6 flex flex-wrap gap-2">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900">
              {s.label} ({s.items.length})
            </a>
          ))}
        </nav>
        {sections.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="mt-10 scroll-mt-24">
            <h2 id={`${s.id}-h`} className="text-2xl font-semibold tracking-tight">
              {s.label}
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {s.items.map((i) => (
                <li key={i.id} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                  <h3 className="leading-snug font-semibold">{i.title}</h3>
                  <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                    {i.authors} · {i.year} · {i.level} {getLevel(i.level)?.name}
                  </p>
                  <p className="mt-2 leading-7">{i.why}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <DownloadLink url={i.url} title={i.title} kind={i.kind} />
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">Hosted by {i.hosted_by}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
