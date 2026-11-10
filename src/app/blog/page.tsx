import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { GuideCover } from "@/components/guide-cover";
import { PageHero } from "@/components/page-hero";
import { muted } from "@/components/ui";
import { getBlogPosts } from "@/lib/content";
import { formatDay } from "@/lib/roadmap/cost";

export const metadata: Metadata = pageMeta({
  // SE-8: search-led title and description.
  title: ["Learn AI Guides: How to Start, Courses, AI Careers", "Learn AI Guides and AI Career Advice"],
  description:
    "Plain guides to learning AI in India: how to start, how to become an AI engineer, free AI courses with certificates and how to prepare for AI interviews.",
  path: "/blog",
});

const BLOG_THEMES = ["career", "ai-basics", "using-ai", "llm", "agents"] as const;

export default function BlogIndex() {
  const posts = getBlogPosts();
  return (
    <main>
      <PageHero shape="quill" theme="using-ai" seed="blog" icon="book" eyebrow="Guides" title="Blog" lead="Guides on learning AI, choosing a role and getting hired. No sponsored posts." />
      <ul className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3 md:px-6">
        {posts.map((p, i) => (
          <li key={p.id} className="">
            <Link
              href={`/blog/${p.id}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <GuideCover cover={p.cover} theme={BLOG_THEMES[i % BLOG_THEMES.length]} seed={p.id} />
              <span className="flex flex-1 flex-col p-5">
                <h2 className="text-lg leading-7 font-semibold group-hover:underline">{p.title}</h2>
                <span className={`mt-1 text-card ${muted}`}>
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
