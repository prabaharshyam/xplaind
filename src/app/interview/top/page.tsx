import type { Metadata } from "next";
import Link from "next/link";
import { Cover } from "@/components/art/cover";
import { PageHero } from "@/components/page-hero";
import { getPaths } from "@/lib/content";

export const metadata: Metadata = {
  title: "Top 25 AI interview questions for every role",
  description: "The 25 interview questions most worth preparing for each AI role, with scenario and real-life questions, clear explanations and examples you can tell.",
  alternates: { canonical: "/interview/top" },
};

/** IQ-8: pick a role's Top 25. */
export default function TopIndexPage() {
  const paths = getPaths().filter((p) => p.top_interview.length);
  return (
    <main>
      <PageHero
        theme="career"
        seed="top-25"
        icon="trophy"
        eyebrow="Interview prep"
        title="Top 25 interview questions, by role"
        lead="For each role, the 25 questions most worth preparing, most of them the scenario and real-life questions interviewers use to see how you think. Read them, print them, then practise out loud."
        crumbs={[{ href: "/interview", label: "Interview questions" }]}
      />
      <ul className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3 md:px-6">
        {paths.map((p) => (
          <li key={p.id} className="lx-rise">
            <Link data-tilt href={`/interview/top/${p.id}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              <Cover theme={p.theme} seed={`top-${p.id}`} icon="trophy" className="h-24" iconSize={30} />
              <span className="p-4">
                <span className="block font-semibold group-hover:underline">Top 25 {p.name} questions</span>
                <span className="mt-1 block text-sm text-zinc-700 dark:text-zinc-300">{p.tagline}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
