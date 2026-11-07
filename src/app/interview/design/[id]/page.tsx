import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DraftNote } from "@/components/draft-note";
import { FlowDiagram } from "@/components/flow-diagram";
import { PageHero } from "@/components/page-hero";
import { primaryButton, textLink } from "@/components/ui";
import { getDesign, getDesigns, getPattern, getStop } from "@/lib/content";
import { getInterviewViews } from "@/lib/content/interview";
import { pageMeta } from "@/lib/seo";

export function generateStaticParams() {
  return getDesigns().map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: PageProps<"/interview/design/[id]">): Promise<Metadata> {
  const d = getDesign((await params).id);
  return d ? pageMeta({ title: `System design: ${d.title}`, description: d.summary, path: `/interview/design/${d.id}`, type: "article" }) : {};
}

const card = "scroll-mt-24 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-950/[0.03] md:p-6 dark:border-zinc-800 dark:bg-zinc-900";

const STEPS = [
  { id: "clarify", title: "Clarify", time: "0-5 min" },
  { id: "requirements", title: "Requirements and numbers", time: "5-8 min" },
  { id: "design", title: "High-level design", time: "8-12 min" },
  { id: "deep-dives", title: "Deep dives", time: "12-26 min" },
  { id: "failures", title: "Failures", time: "26-30 min" },
  { id: "evals", title: "Evals and monitoring", time: "30-33 min" },
  { id: "trade-offs", title: "Trade-offs", time: "33-35 min" },
] as const;

function Head({ n, id }: { n: number; id: (typeof STEPS)[number]["id"] }) {
  const s = STEPS.find((x) => x.id === id)!;
  return (
    <h2 id={`${id}-h`} className="flex flex-wrap items-center gap-3 text-xl font-semibold">
      <span className="grid size-8 place-items-center rounded-full bg-violet-700 text-sm font-bold text-white">{n}</span>
      {s.title}
      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{s.time}</span>
    </h2>
  );
}

const Bullets = ({ items }: { items: string[] }) => (
  <ul className="mt-3 flex flex-col gap-2">
    {items.map((t) => (
      <li key={t} className="flex gap-3 leading-7">
        <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-violet-500" />
        {t}
      </li>
    ))}
  </ul>
);

/** IP-2: one worked system design answer, step by step in interview order. */
export default async function DesignPage({ params }: PageProps<"/interview/design/[id]">) {
  const d = getDesign((await params).id);
  if (!d) notFound();
  const patterns = d.patterns.map((id) => getPattern(id)).filter((p) => p !== undefined);
  const qs = getInterviewViews().filter((q) => d.questions.includes(q.id));
  const lessons = d.lessons.map((id) => getStop(id)).filter((l) => l !== undefined);
  return (
    <main>
      <PageHero theme="system-design" seed={d.id} icon="flow" eyebrow="System design answer" title={d.title} lead={d.summary} crumbs={[{ href: "/interview", label: "Interview" }, { href: "/interview/design", label: "System design" }]} />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[14rem_minmax(0,1fr)_260px]">
        <nav aria-label="Steps of the answer" className="hidden lg:block">
          <ol className="sticky top-20 flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            {STEPS.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="flex items-baseline gap-2 rounded-2xl px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">{i + 1}</span>
                  <span>
                    {s.title}
                    <span className="block text-xs text-zinc-600 dark:text-zinc-400">{s.time}</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex min-w-0 flex-col gap-6">
          {d.reviewed_by === "UNREVIEWED" && <DraftNote />}
          <blockquote className="rounded-3xl border border-violet-200 bg-violet-50/60 p-5 text-lg leading-8 dark:border-violet-900 dark:bg-violet-950/30">
            <span className="block text-sm font-semibold text-violet-900 dark:text-violet-200">The question</span>
            &ldquo;{d.prompt}&rdquo;
          </blockquote>
          <section id="clarify" aria-labelledby="clarify-h" className={card}>
            <Head n={1} id="clarify" />
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Ask before you draw. These answers change the design.</p>
            <Bullets items={d.clarify} />
          </section>
          <section id="requirements" aria-labelledby="requirements-h" className={card}>
            <Head n={2} id="requirements" />
            <div className="mt-3 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-semibold">It must</h3>
                <Bullets items={d.requirements.functional} />
              </div>
              <div>
                <h3 className="font-semibold">And it must be</h3>
                <Bullets items={d.requirements.non_functional} />
              </div>
            </div>
            <h3 className="mt-6 font-semibold">Numbers to say out loud</h3>
            <dl className="mt-2 grid gap-3 sm:grid-cols-2">
              {d.estimates.map((e) => (
                <div key={e.label} className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-950">
                  <dt className="text-sm text-zinc-600 dark:text-zinc-400">{e.label}</dt>
                  <dd className="mt-0.5 font-medium">{e.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section id="design" aria-labelledby="design-h" className={card}>
            <Head n={3} id="design" />
            <FlowDiagram source={d.architecture} />
          </section>
          <section id="deep-dives" aria-labelledby="deep-dives-h" className={card}>
            <Head n={4} id="deep-dives" />
            <div className="mt-3 flex flex-col gap-5">
              {d.deep_dives.map((x) => (
                <div key={x.title}>
                  <h3 className="font-semibold">{x.title}</h3>
                  <p className="mt-1 leading-7 text-zinc-800 dark:text-zinc-200">{x.body}</p>
                </div>
              ))}
            </div>
          </section>
          <section id="failures" aria-labelledby="failures-h" className={card}>
            <Head n={5} id="failures" />
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th scope="col" className="py-2 pr-4 font-semibold">What can go wrong</th>
                    <th scope="col" className="py-2 font-semibold">What stops it</th>
                  </tr>
                </thead>
                <tbody>
                  {d.failures.map((f) => (
                    <tr key={f.risk} className="border-b border-zinc-100 align-top last:border-0 dark:border-zinc-800">
                      <td className="py-2.5 pr-4 font-medium">{f.risk}</td>
                      <td className="py-2.5 leading-6">{f.mitigation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section id="evals" aria-labelledby="evals-h" className={card}>
            <Head n={6} id="evals" />
            <Bullets items={d.evals} />
          </section>
          <section id="trade-offs" aria-labelledby="trade-offs-h" className={card}>
            <Head n={7} id="trade-offs" />
            <Bullets items={d.trade_offs} />
            <h3 className="mt-6 font-semibold">Follow-ups to expect</h3>
            <Bullets items={d.follow_ups} />
          </section>
          <p>
            <Link href="/interview/simulator" className={primaryButton}>
              Practise out loud in the mock interview
            </Link>
          </p>
        </div>
        <aside className="flex min-w-0 flex-col gap-4 lg:col-start-2 xl:col-start-auto xl:sticky xl:top-20 xl:self-start">
          <section className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900" aria-labelledby="pat-h">
            <h2 id="pat-h" className="font-semibold">
              Patterns used
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {patterns.map((p) => (
                <li key={p.id}>
                  <Link href={`/interview/patterns/${p.id}`} className="inline-flex min-h-11 items-center rounded-full border border-violet-200 px-3 text-sm font-medium text-violet-900 hover:bg-violet-50 dark:border-violet-900 dark:text-violet-200 dark:hover:bg-violet-950">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          {qs.length > 0 && (
            <section className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900" aria-labelledby="dq-h">
              <h2 id="dq-h" className="font-semibold">
                Related questions
              </h2>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm">
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
          <section className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900" aria-labelledby="dl-h">
            <h2 id="dl-h" className="font-semibold">
              Lessons behind it
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
        </aside>
      </div>
    </main>
  );
}
