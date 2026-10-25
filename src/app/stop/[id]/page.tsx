import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getLevel, getResource, getStop, getStops } from "@/lib/content";

export function generateStaticParams() {
  return getStops().map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/stop/[id]">): Promise<Metadata> {
  const stop = getStop((await params).id);
  return stop ? { title: stop.title, description: stop.outcome } : {};
}

export default async function StopPage({ params }: PageProps<"/stop/[id]">) {
  const stop = getStop((await params).id);
  if (!stop) notFound();

  const level = getLevel(stop.level);
  const resources = [stop.primary_resource, ...stop.alternates].map((id) => getResource(id)!);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm text-zinc-500">
        {stop.level} · {level?.name} · about {stop.hours} {stop.hours === 1 ? "hour" : "hours"}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">{stop.title}</h1>
      <p className="mt-4 text-lg leading-8">{stop.outcome}</p>

      <h2 className="mt-8 text-xl font-semibold">Why it matters</h2>
      <p className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">{stop.why_it_matters}</p>

      <h2 className="mt-8 text-xl font-semibold">Learn it</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {resources.map((r, i) => (
          <li key={r.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {i === 0 ? "Start here" : "Alternative"}
            </p>
            {/* Slice S3 replaces this with the full resource card (RM-4, RM-6). */}
            <a className="mt-1 block font-medium underline underline-offset-2" href={r.url} rel="noreferrer">
              {r.title}
            </a>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {r.provider} · {r.cost === "free" ? "Free" : "Paid"} · about {r.hours} h
            </p>
            <p className="mt-2 text-sm">{r.why_picked}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Do it</h2>
      <div className="mt-2 leading-7 [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
        <MDXRemote source={stop.body} />
      </div>

      <h2 className="mt-8 text-xl font-semibold">Check</h2>
      {stop.check.type === "project" ? (
        <p className="mt-2 leading-7">{stop.check.brief}</p>
      ) : (
        <p className="mt-2 leading-7">
          {stop.check.question_ids.length} quick questions. The quiz arrives in a later slice.
        </p>
      )}
    </main>
  );
}
