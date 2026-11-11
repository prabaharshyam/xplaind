import Link from "next/link";
import { proOpen } from "@/lib/billing/config";
import { AccountLink, SignedInLinks } from "./account-link";
import { Icon } from "./art/icons";
import { BrandLogo } from "./brand-logo";
import { getCommunity } from "@/lib/content/community";

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
    title: "Practice",
    links: [
      { href: "/projects", label: "Projects" },
      { href: "/practice", label: "Practice cards" },
      { href: "/playground", label: "Code playground" },
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
      { href: "/papers", label: "Research papers" },
      { href: "/how-we-rank", label: "How we rank" },
      { href: "/disclosure", label: "Affiliate disclosure" },
    ],
  },
  {
    title: "You",
    links: [
      { href: "/dashboard", label: "Your dashboard" },
      { href: "/plan", label: "Weekly plan" },
      { href: "/jobs", label: "Jobs and salaries" },
      { href: "/about", label: "About Xplaind" },
      { href: "/about#founder", label: "Meet the founder" },
    ],
  },
];

const link = "rounded text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline dark:text-zinc-400 dark:hover:text-white";

/** The site footer: the logo and promise, the community invite, then the site map in four short columns. */
export function SiteFooter() {
  const whatsapp = getCommunity().whatsapp_url;
  return (
    <footer className="site-footer relative mt-16 overflow-hidden border-t border-zinc-200 bg-white text-sm dark:border-white/10 dark:bg-[#0e0b1c]">
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-8 md:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr]">
          <div className="max-w-sm">
            <Link href="/" aria-label="Xplaind home" className="inline-block">
              <BrandLogo height={52} tagline />
            </Link>
            <p className="mt-4 leading-relaxed text-zinc-600 dark:text-zinc-400">
              Step-by-step AI career roadmaps with plain-English lessons, projects and interview practice. Our mission: help India learn AI faster.
            </p>
            <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Learn with others</p>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                Ask questions, share what you are building and find study partners in our WhatsApp group.
              </p>
              {/* CM-2: straight to the WhatsApp group; there is no separate Community page. */}
              <a
                href={whatsapp || "/community"}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-violet-700 px-4 font-medium text-white hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
              >
                <Icon name="chat" size={16} /> Join the community
                <span className="sr-only"> on WhatsApp (opens in a new tab)</span>
              </a>
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h2 className="text-xs font-semibold tracking-[0.12em] text-zinc-900 dark:text-zinc-100">{col.title}</h2>
                <ul className="mt-3 space-y-1">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className={`${link} inline-block py-2 sm:py-1`}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                  {col.title === "You" && (
                    <>
                      <li>
                        <AccountLink className={`${link} inline-block py-2 sm:py-1`} />
                      </li>
                      <li className="flex flex-col items-start">
                        <SignedInLinks linkClass={`${link} inline-block py-2 sm:py-1`} buttonClass={`${link} inline-block cursor-pointer py-2 text-left sm:py-1`} />
                      </li>
                    </>
                  )}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-violet-100 pt-6 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:text-zinc-400">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>© Xplaind. AI, explained simply.</span>
            <Link href="/about" className={`${link} inline-flex min-h-11 items-center sm:min-h-0`}>
              About
            </Link>
            <Link href="/privacy" className={`${link} inline-flex min-h-11 items-center sm:min-h-0`}>
              Privacy
            </Link>
            <Link href="/terms" className={`${link} inline-flex min-h-11 items-center sm:min-h-0`}>
              Terms
            </Link>
            <Link href="/refunds" className={`${link} inline-flex min-h-11 items-center sm:min-h-0`}>
              Refunds and cancellations
            </Link>
            {proOpen() && (
              <Link href="/pricing" className={`${link} inline-flex min-h-11 items-center sm:min-h-0`}>
                Pricing
              </Link>
            )}
          </p>
          <p>No ads and no sponsored rankings. Book links are affiliate links. Prices show the date we checked them.</p>
        </div>
      </div>
    </footer>
  );
}
