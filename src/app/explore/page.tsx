import type { Metadata } from "next";
import Link from "next/link";
import { AccountLink, SignedInLinks } from "@/components/account-link";
import { PageHero } from "@/components/page-hero";
import { getCommunity } from "@/lib/content/community";
import { pageMeta } from "@/lib/seo";
import { SITE_MAP } from "@/lib/site-map";

export const metadata: Metadata = pageMeta({
  title: "All pages on Xplaind",
  description: "Every part of Xplaind in one list: lessons, practice, interview prep, courses and books, your account, and our policies.",
  path: "/explore",
});

const link = "inline-flex min-h-11 items-center rounded text-brand-800 underline-offset-4 hover:underline dark:text-brand-300";

/** FT-1: the full site map, moved out of the footer so the footer can stay short. */
export default function ExplorePage() {
  const whatsapp = getCommunity().whatsapp_url;
  return (
    <main>
      <PageHero theme="career" shape="icon:book" icon="book" eyebrow="All pages" title="Everything on Xplaind" lead="Every part of the site in one place." />
      <div className="mx-auto max-w-5xl px-4 pt-4 pb-16 md:px-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {SITE_MAP.map((col) => (
            <section key={col.title} aria-labelledby={`map-${col.title}`}>
              <h2 id={`map-${col.title}`} className="text-lg font-semibold">
                {col.title}
              </h2>
              <ul className="mt-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={link}>
                      {l.label}
                    </Link>
                  </li>
                ))}
                {col.title === "You" && (
                  <>
                    <li>
                      <AccountLink className={link} />
                    </li>
                    <li className="flex flex-col items-start">
                      <SignedInLinks linkClass={link} buttonClass={`${link} cursor-pointer text-left`} />
                    </li>
                  </>
                )}
              </ul>
            </section>
          ))}
        </div>
        <section aria-labelledby="map-community" className="mt-12 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 id="map-community" className="text-lg font-semibold">
            Learn with others
          </h2>
          <p className="mt-1 leading-7 text-zinc-700 dark:text-zinc-300">Ask questions, share what you are building and find study partners in our WhatsApp group.</p>
          <a href={whatsapp || "/community"} target="_blank" rel="noopener noreferrer" className={`${link} mt-2 font-medium`}>
            Join the community<span className="sr-only"> on WhatsApp (opens in a new tab)</span>
          </a>
        </section>
      </div>
    </main>
  );
}
