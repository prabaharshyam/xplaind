import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { DraftNote } from "@/components/draft-note";
import { JsonLd } from "@/components/json-ld";
import { card, muted, textLink } from "@/components/ui";
import { getBlogPost, getBlogPosts, getPath, getStop } from "@/lib/content";
import { isHumanName } from "@/lib/content/review";
import { roadmapHref } from "@/lib/paths";
import { formatDay } from "@/lib/roadmap/cost";
import { siteUrl } from "@/lib/site";

/** Article text: the same plain styles as lessons, without a typography plugin. */
const PROSE =
  "mt-6 leading-7 [&_a]:text-emerald-800 [&_a]:underline [&_a]:underline-offset-2 dark:[&_a]:text-emerald-400 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:font-semibold [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_strong]:font-semibold [&_blockquote]:mt-3 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 dark:[&_blockquote]:border-zinc-700 [&_table]:mt-3 [&_table]:block [&_table]:overflow-x-auto [&_td]:border [&_td]:border-zinc-300 [&_td]:p-2 [&_th]:border [&_th]:border-zinc-300 [&_th]:p-2 [&_th]:text-left dark:[&_td]:border-zinc-700 dark:[&_th]:border-zinc-700";

export function generateStaticParams() {
  return getBlogPosts().map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = getBlogPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.id}` },
    openGraph: { type: "article", title: post.title, description: post.description, publishedTime: post.published_on, modifiedTime: post.updated_on },
  };
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const post = getBlogPost((await params).slug);
  if (!post) notFound();
  const base = siteUrl();
  const paths = post.related_paths.map((id) => getPath(id)!);
  const lessons = post.related_lessons.map((id) => getStop(id)!);
  const more = getBlogPosts().filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      {/* MO-2: a reading-progress bar under the top bar. */}
      <div aria-hidden="true" className="lx-progress" />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.description,
          datePublished: post.published_on,
          dateModified: post.updated_on,
          author: { "@type": "Organization", name: post.author, url: base },
          publisher: { "@type": "Organization", name: "Xplaind", url: base },
          mainEntityOfPage: `${base}/blog/${post.id}`,
        }}
      />
      {post.faq.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: post.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          }}
        />
      )}
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/blog" className={textLink}>
          Blog
        </Link>
      </nav>
      <article>
        <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight text-balance">{post.title}</h1>
        <p className={`mt-3 text-sm ${muted}`}>
          By {post.author} · <time dateTime={post.updated_on}>updated {formatDay(post.updated_on)}</time>
        </p>
        {!isHumanName(post.reviewed_by) && (
          <div className="mt-4">
            <DraftNote />
          </div>
        )}
        <div className={PROSE}>
          <MDXRemote source={post.body} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
        </div>

        {post.faq.length > 0 && (
          <section aria-labelledby="faq" className="mt-10">
            <h2 id="faq" className="text-xl font-semibold">
              Questions people ask
            </h2>
            <dl className="mt-3 flex flex-col gap-4">
              {post.faq.map((f) => (
                <div key={f.q}>
                  <dt className="font-medium">{f.q}</dt>
                  <dd className="mt-1 leading-7">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </article>

      {(paths.length > 0 || lessons.length > 0) && (
        <aside aria-labelledby="next" className={`mt-10 ${card}`}>
          <h2 id="next" className="font-semibold">
            Start learning
          </h2>
          <ul className="mt-2 flex flex-col gap-1 leading-7">
            {paths.map((p) => (
              <li key={p.id}>
                <Link href={roadmapHref(p.id)} className={textLink}>
                  {p.name} path
                </Link>{" "}
                <span className={`text-sm ${muted}`}>{p.tagline}</span>
              </li>
            ))}
            {lessons.map((s) => (
              <li key={s.id}>
                <Link href={`/stop/${s.id}`} className={textLink}>
                  Lesson: {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}

      {more.length > 0 && (
        <nav aria-labelledby="more-posts" className="mt-10">
          <h2 id="more-posts" className="font-semibold">
            More from the blog
          </h2>
          <ul className="mt-2 flex flex-col gap-1">
            {more.map((p) => (
              <li key={p.id}>
                <Link href={`/blog/${p.id}`} className={textLink}>
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </main>
  );
}
