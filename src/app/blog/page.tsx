import type { Metadata } from "next";
import Link from "next/link";
import { card, muted } from "@/components/ui";
import { getBlogPosts } from "@/lib/content";
import { formatDay } from "@/lib/roadmap/cost";

export const metadata: Metadata = {
  title: "Blog: how to learn AI, free courses and careers",
  description:
    "Plain guides on learning AI: where to start, free certifications from big tech, YouTube channels worth your time, and how to prepare for AI interviews in India.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  const posts = getBlogPosts();
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
      <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
        Guides on learning AI for free, choosing a path and getting hired. No sponsored posts.
      </p>
      <ul className="mt-8 flex flex-col gap-4">
        {posts.map((p) => (
          <li key={p.id} className={card}>
            <h2 className="text-lg font-semibold leading-7">
              <Link href={`/blog/${p.id}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-emerald-700">
                {p.title}
              </Link>
            </h2>
            <p className={`mt-1 text-sm ${muted}`}>
              <time dateTime={p.updated_on}>Updated {formatDay(p.updated_on)}</time>
            </p>
            <p className="mt-2 leading-7">{p.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
