import Link from "next/link";
import { BUSINESS } from "@/lib/business";
import { NAV_GROUPS, PRO_LINK } from "@/lib/nav";
import { Icon } from "./art/icons";
import { BrandLogo } from "./brand-logo";
import { getCommunity } from "@/lib/content/community";

// FT-2 (2026-11-27, owner: "I want it to be like earlier, with all the information about the site, with all the
// Menu options, but with a great design"). The four menu groups come from the menu itself (NAV_GROUPS), so the
// footer and the menu can never drift apart; Resources and Company hold the rest of the site. On phones each column
// folds into a row that opens, so the footer stays short there (FT-1's reason).
type Col = { title: string; dot: string; links: { href: string; label: string }[] };
/** UX-13: each column carries a dot in its menu colour. */
const DOT: Record<string, string> = { learn: "bg-brand-600", interview: "bg-rose-500", career: "bg-amber-500", ai: "bg-sky-500" };
const COLUMNS: Col[] = [
  ...NAV_GROUPS.map((g) => ({
    title: g.label,
    dot: DOT[g.id] ?? "bg-brand-600",
    links: [
      ...g.items.map((i) => ({ href: i.href, label: i.label })),
      ...(g.id === "interview" ? [{ href: "/practice", label: "Practice cards" }] : []),
    ],
  })),
  {
    title: "Resources",
    dot: "bg-emerald-500",
    links: [
      { href: "/resources", label: "Courses" },
      { href: "/certifications", label: "Certifications" },
      { href: "/books", label: "Books" },
      { href: "/blog", label: "Blog" },
      { href: "/how-we-rank", label: "How we rank" },
      { href: "/disclosure", label: "Affiliate disclosure" },
    ],
  },
  {
    title: "Company",
    dot: "bg-zinc-400",
    links: [
      { href: "/about", label: "About" },
      { href: "/about#founder", label: "Meet the founder" },
      { href: "/stories", label: "Learner stories" },
      { href: "/colleges", label: "For colleges" },
      { href: PRO_LINK.href, label: PRO_LINK.label },
      { href: "/contact", label: "Contact" },
      { href: "/explore", label: "All pages" },
    ],
  },
];
const LEGAL = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refunds", label: "Refunds and cancellations" },
];
const PROMISES = ["No ads and no sponsored rankings", "Every price shows the date we checked it", "Built in India, for the world"];

const link = "inline-flex min-h-11 items-center rounded text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline dark:text-zinc-400 dark:hover:text-white sm:min-h-0 sm:py-1.5";
const heading = "flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-zinc-900 uppercase dark:text-zinc-100";

function Links({ col }: { col: Col }) {
  return (
    <ul>
      {col.links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className={link}>
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The site footer: who we are and what we promise, every part of the site by menu group, then policies and business details. */
export function SiteFooter() {
  const whatsapp = getCommunity().whatsapp_url;
  return (
    <footer className="site-footer relative mt-16 border-t border-zinc-200 bg-[var(--hero)] text-sm dark:border-white/10 dark:bg-[#071a1d]">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-8 md:px-6 md:pt-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-md">
            <Link href="/" aria-label="Xplaind home" className="inline-block">
              <BrandLogo height={48} tagline className="max-sm:[&_img]:h-10 max-sm:[&_img]:w-auto" />
            </Link>
            <p className="mt-4 leading-6 text-zinc-700 sm:text-base sm:leading-7 dark:text-zinc-300">
              Step-by-step AI career roadmaps with plain-English lessons, projects and interview practice, in the order that gets you hired.
            </p>
          </div>
          <div className="flex flex-col gap-4 lg:items-end">
            <ul className="flex flex-col gap-1.5 lg:items-end">
              {PROMISES.map((p) => (
                <li key={p} className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <span aria-hidden="true" className="grid size-5 place-items-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <Icon name="tick" size={12} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            {/* CM-2: straight to the WhatsApp group; there is no separate Community page. */}
            <a
              href={whatsapp || "/community"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-brand-700 px-5 font-medium text-white hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 lg:self-end dark:bg-brand-300 dark:text-brand-950 dark:hover:bg-brand-200"
            >
              <Icon name="chat" size={16} /> Join the community
              <span className="sr-only"> on WhatsApp (opens in a new tab)</span>
            </a>
          </div>
        </div>

        <nav aria-label="Footer" className="mt-8 border-t border-zinc-300/70 pt-6 md:mt-12 md:pt-8 dark:border-white/10">
          {/* Larger screens: every column open. */}
          <div className="hidden gap-x-6 gap-y-10 sm:grid sm:grid-cols-3 lg:grid-cols-6">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h2 className={heading}>
                  <span aria-hidden="true" className={`size-1.5 rounded-full ${col.dot}`} />
                  {col.title}
                </h2>
                <div className="mt-3">
                  <Links col={col} />
                </div>
              </div>
            ))}
          </div>
          {/* Phones: one row per column, opened on tap. Works without JavaScript. */}
          <div className="-mt-2 divide-y divide-zinc-300/70 sm:hidden dark:divide-white/10">
            {COLUMNS.map((col) => (
              <details key={col.title} className="group">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
                  <h2 className={heading}>
                    <span aria-hidden="true" className={`size-1.5 rounded-full ${col.dot}`} />
                    {col.title}
                  </h2>
                  <span aria-hidden="true" className="text-lg text-zinc-500 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="pb-3">
                  <Links col={col} />
                </div>
              </details>
            ))}
          </div>
        </nav>

        <div className="mt-6 flex flex-col gap-3 border-t border-zinc-300/70 pt-6 text-xs leading-5 text-zinc-600 md:mt-12 dark:border-white/10 dark:text-zinc-400">
          <div className="flex flex-col gap-x-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="flex flex-wrap items-center gap-x-5">
              <span className="inline-flex min-h-11 items-center">© Xplaind. AI, explained simply.</span>
              {LEGAL.map((l) => (
                <Link key={l.href} href={l.href} className={link}>
                  {l.label}
                </Link>
              ))}
            </p>
            <p>Book links are affiliate links; they never change what we recommend.</p>
          </div>
          {/* BIZ-1: the business behind the brand and how to reach it. FT-2 (owner, 2026-11-27): no GST number here; it is on the Contact page. */}
          <p>
            Xplaind is a brand of {BUSINESS.legalName} ·{" "}
            <a href={`mailto:${BUSINESS.email}`} className="underline-offset-4 hover:underline">
              {BUSINESS.email}
            </a>{" "}
            ·{" "}
            <a href={BUSINESS.phoneHref} className="underline-offset-4 hover:underline">
              {BUSINESS.phone}
            </a>{" "}
            · {BUSINESS.hours}
          </p>
        </div>
      </div>
    </footer>
  );
}
