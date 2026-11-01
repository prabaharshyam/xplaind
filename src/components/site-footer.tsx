import Link from "next/link";
import { AccountLink } from "./account-link";
import { Icon } from "./art/icons";
import { BrandLogo } from "./brand-logo";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Learn",
    links: [
      { href: "/paths", label: "Roadmaps" },
      { href: "/library", label: "Library" },
      { href: "/topics", label: "Topics" },
      { href: "/videos", label: "Videos" },
      { href: "/glossary", label: "Glossary" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Practise",
    links: [
      { href: "/projects", label: "Projects" },
      { href: "/practice", label: "Practice cards" },
      { href: "/interview", label: "Interview questions" },
      { href: "/interview/simulator", label: "Mock interview" },
      { href: "/ai", label: "AI tools" },
    ],
  },
  {
    title: "Courses and books",
    links: [
      { href: "/resources", label: "Courses" },
      { href: "/certifications", label: "Certifications" },
      { href: "/books", label: "Books" },
      { href: "/how-we-rank", label: "How we rank" },
      { href: "/disclosure", label: "Affiliate disclosure" },
    ],
  },
  {
    title: "You",
    links: [
      { href: "/dashboard", label: "Your progress" },
      { href: "/community", label: "Community" },
    ],
  },
];

const link = "rounded text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline dark:text-zinc-400 dark:hover:text-white";

/** The site footer: the logo and promise, the community invite, then the site map in four short columns. */
export function SiteFooter() {
  return (
    <footer className="site-footer relative mt-16 overflow-hidden border-t border-violet-100 bg-gradient-to-b from-white via-violet-50/50 to-blue-50/60 text-sm dark:border-white/10 dark:from-[#0e0b1c] dark:via-[#110d24] dark:to-[#0b1230]">
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-8 md:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr]">
          <div className="max-w-sm">
            <Link href="/" aria-label="Xplaind home" className="inline-block">
              <BrandLogo height={52} tagline />
            </Link>
            <p className="mt-4 leading-relaxed text-zinc-600 dark:text-zinc-400">
              Step-by-step AI roadmaps for nine roles, with plain-English lessons, projects and interview practice. Made for learners in India.
            </p>
            <div className="mt-5 rounded-2xl border border-emerald-200/80 bg-white/80 p-4 shadow-sm dark:border-emerald-900/60 dark:bg-white/5">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Learn with others</p>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                Ask questions, share what you are building and find study partners in our WhatsApp group.
              </p>
              <Link
                href="/community"
                className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-emerald-700 px-4 font-medium text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                <Icon name="chat" size={16} /> Join the community
              </Link>
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h2 className="text-xs font-semibold tracking-[0.12em] text-zinc-900 uppercase dark:text-zinc-100">{col.title}</h2>
                <ul className="mt-3 space-y-1">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className={`${link} inline-block py-1`}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                  {col.title === "You" && (
                    <li>
                      <AccountLink className={`${link} inline-block py-1`} />
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-violet-100 pt-6 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:text-zinc-400">
          <p>© Xplaind. AI, explained simply.</p>
          <p>No ads and no sponsored rankings. Book links are affiliate links. Prices show the date we checked them.</p>
        </div>
      </div>
    </footer>
  );
}
