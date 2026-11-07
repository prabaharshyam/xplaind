import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DraftNote } from "@/components/draft-note";
import { FlowDiagram } from "@/components/flow-diagram";
import { PageHero } from "@/components/page-hero";
import { textLink } from "@/components/ui";
import { getDesigns, getPattern, getPatterns, getStop } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import { pageMeta } from "@/lib/seo";
import { CATEGORY } from "../../labels";

export function generateStaticParams() {
  return getPatterns().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/interview/patterns/[id]">): Promise<Metadata> {
  const p = getPattern((await params).id);
  return p ? pageMeta({ title: `${p.name}: AI interview pattern`, description: p.summary, path: `/interview/patterns/${p.id}`, type: "article" }) : {};
}

const card = "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.03] md:p-6 dark:border-zinc-800 dark:bg-zinc-900";

function List({ title, items, tone }: { title: string; items: string[]; tone: "violet" | "emerald" | "rose" }) {
  const dot = { violet: "bg-violet-500", emerald: "bg-emerald-500", rose: "bg-rose-500" }[tone];
  return (
    <section className={card} aria-label={title}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((t) => (
          <li key={t} className="flex gap-3 leading-7">
            <span aria-hidden="true" className={`mt-2.5 size-1.5 shrink-0 rounded-full ${dot}`} />
            {t}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** IP-1: one interview pattern. */
export default async function PatternPage({ params }: PageProps<"/interview/patterns/[id]">) {
  const p = getPattern((await params).id);
  if (!p) notFound();
  const qs = getInterviewViews().filter((q) => p.questions.includes(q.id));
  const lessons = p.lessons.map((id) => getStop(id)).filter((l) => l !== undefined);
  const designs = getDesigns().filter((d) => d.patterns.includes(p.id));
  const same = getPatterns().filter((x) => x.category === p.category && x.id !== p.id);
  return (
    <main>
      <PageHero theme="system-design" seed={p.id} icon={CATEGORY[p.category].icon} eyebrow={`Pattern · ${CATEGORY[p.category].label}`} title={p.name} lead={p.summary} crumbs={[{ href: "/interview", label: "Interview" }, { href: "/interview/patterns", label: "Patterns" }]} />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-6">
          {p.reviewed_by === "UNREVIEWED" && <DraftNote />}
          <section className="rounded-2xl border border-violet-200 bg-violet-50/60 p-5 md:p-6 dark:border-violet-900 dark:bg-violet-950/30" aria-labelledby="say-h">
            <h2 id="say-h" className="text-sm font-semibold text-violet-900 dark:text-violet-200">
              Say it in the interview
            </h2>
            <p className="mt-2 text-lg leading-8">{p.say_it}</p>
          </section>
          <List title="When to use it" items={p.when_to_use} tone="violet" />
          <section className={card} aria-labelledby="how-h">
            <h2 id="how-h" className="text-lg font-semibold">
              How it works
            </h2>
            <FlowDiagram source={p.flow} />
          </section>
          <div className="grid gap-6 md:grid-cols-2">
            <List title="Trade-offs" items={p.trade_offs} tone="emerald" />
            <List title="Pitfalls interviewers probe" items={p.pitfalls} tone="rose" />
          </div>
          {qs.length > 0 && (
            <section className={card} aria-labelledby="q-h">
              <h2 id="q-h" className="text-lg font-semibold">
                Practise it on these questions
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {qs.map((q) => (
                  <li key={q.id}>
                    <Link href={`/interview/${q.id}`} className={textLink}>
                      {q.question}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          <section className={card} aria-labelledby="learn-h">
            <h2 id="learn-h" className="font-semibold">
              Learn it properly
            </h2>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm">
              {lessons.map((l) => (
                <li key={l.id}>
                  <Link href={`/stop/${l.id}`} className={textLink}>
                    {l.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          {designs.length > 0 && (
            <section className={card} aria-labelledby="used-h">
              <h2 id="used-h" className="font-semibold">
                Used in these designs
              </h2>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                {designs.map((d) => (
                  <li key={d.id}>
                    <Link href={`/interview/design/${d.id}`} className={textLink}>
                      {d.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {same.length > 0 && (
            <section className={card} aria-labelledby="more-h">
              <h2 id="more-h" className="font-semibold">
                More in {CATEGORY[p.category].label}
              </h2>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                {same.map((x) => (
                  <li key={x.id}>
                    <Link href={`/interview/patterns/${x.id}`} className={textLink}>
                      {x.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
