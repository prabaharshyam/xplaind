import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DraftNote } from "@/components/draft-note";
import { PageHero } from "@/components/page-hero";
import { textLink } from "@/components/ui";
import { getCheatsheet, getCheatsheets, getStop } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import { CheatsheetView } from "./cheatsheet-view";

export function generateStaticParams() {
  return getCheatsheets().map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/cheatsheets/[id]">): Promise<Metadata> {
  const s = getCheatsheet((await params).id);
  return s ? pageMeta({ title: `${s.title} cheatsheet`, description: s.summary, path: `/cheatsheets/${s.id}`, type: "article" }) : {};
}

/** CS-1, CS-2: one cheatsheet, interactive, with a PDF download. */
export default async function CheatsheetPage({ params }: PageProps<"/cheatsheets/[id]">) {
  const s = getCheatsheet((await params).id);
  if (!s) notFound();
  const lessons = s.lessons.map((id) => getStop(id)).filter((l) => l !== undefined);
  return (
    <main>
      <PageHero theme={s.theme} seed={s.id} icon="book" eyebrow="Cheatsheet" title={s.title} lead={s.summary} crumbs={[{ href: "/cheatsheets", label: "Cheatsheets" }]} />
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        {s.reviewed_by === "UNREVIEWED" && (
          <div className="mb-6">
            <DraftNote />
          </div>
        )}
        <CheatsheetView sheet={s} />
        {lessons.length > 0 && (
          <section aria-labelledby="learn-h" className="mt-12 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <h2 id="learn-h" className="text-lg font-semibold">
              Learn it properly
            </h2>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {lessons.map((l) => (
                <li key={l.id}>
                  <Link href={`/stop/${l.id}`} className={textLink}>
                    {l.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
