import type { Metadata } from "next";
import Link from "next/link";
import { Cover } from "@/components/art/cover";
import { PageHero } from "@/components/page-hero";
import { muted } from "@/components/ui";
import { getBlogPosts } from "@/lib/content";
import { formatDay } from "@/lib/roadmap/cost";

export const metadata: Metadata = {
  title: "Blog: how to learn AI, free courses and careers",
  description:
    "Plain guides on learning AI: where to start, free certifications from big tech, YouTube channels worth your time, and how to prepare for AI interviews in India.",
  alternates: { canonical: "/blog" },
};

const BLOG_THEMES = ["career", "ai-basics", "using-ai", "llm", "agents"] as const;

export default function BlogIndex() {
  const posts = getBlogPosts();
  return (
    <main>
      <PageHero theme="using-ai" seed="blog" icon="book" eyebrow="Guides" title="Blog" lead="Guides on learning AI for free, choosing a role and getting hired. No sponsored posts." />
      <ul className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3 md:px-6">
        {posts.map((p, i) => (
          <li key={p.id}>
            <Link
              href={`/blog/${p.id}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <Cover theme={BLOG_THEMES[i % BLOG_THEMES.length]} seed={p.id} icon="book" className="h-36" iconSize={40} />
              <span className="flex flex-1 flex-col p-5">
                <h2 className="text-lg leading-7 font-semibold group-hover:underline">{p.title}</h2>
                <span className={`mt-1 text-sm ${muted}`}>
                  <time dateTime={p.updated_on}>Updated {formatDay(p.updated_on)}</time>
                </span>
                <span className="mt-2 leading-7 text-zinc-700 dark:text-zinc-300">{p.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
