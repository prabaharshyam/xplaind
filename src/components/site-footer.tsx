import Link from "next/link";
import { BUSINESS } from "@/lib/business";
import { BrandLogo } from "./brand-logo";
import { getCommunity } from "@/lib/content/community";

// FT-1 (owner request, 2026-11-18): a short footer. The full site map lives on /explore, and the business
// details (GSTIN, email, phone, hours) on /contact.
const NAV: { href: string; label: string }[] = [
  { href: "/paths", label: "Roadmaps" },
  { href: "/library", label: "Library" },
  { href: "/interview", label: "Interview" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/how-we-rank", label: "How we rank" },
  { href: "/contact", label: "Contact" },
  { href: "/explore", label: "All pages" },
];
const LEGAL: { href: string; label: string }[] = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refunds", label: "Refunds and cancellations" },
];

const link = "inline-flex min-h-11 items-center rounded text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline dark:text-zinc-400 dark:hover:text-white";

/** The site footer: the logo and promise, one row of main links, the policies and who runs the site. */
export function SiteFooter() {
  const whatsapp = getCommunity().whatsapp_url;
  return (
    <footer className="site-footer relative mt-16 overflow-hidden border-t border-zinc-200 bg-white text-sm dark:border-white/10 dark:bg-[#071a1d]">
      <div className="mx-auto max-w-6xl px-4 pt-8 pb-6 md:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <Link href="/" aria-label="Xplaind home" className="inline-block">
              <BrandLogo height={48} tagline />
            </Link>
            <p className="mt-3 leading-relaxed text-zinc-600 dark:text-zinc-400">Plain-English AI career roadmaps for India.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5">
            {NAV.map((l) => (
              <Link key={l.href} href={l.href} className={link}>
                {l.label}
              </Link>
            ))}
            {/* CM-2: straight to the WhatsApp group; there is no separate Community page. */}
            <a href={whatsapp || "/community"} target="_blank" rel="noopener noreferrer" className={link}>
              Join the community<span className="sr-only"> on WhatsApp (opens in a new tab)</span>
            </a>
          </nav>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 border-t border-brand-100 pt-3 text-xs text-zinc-600 dark:border-white/10 dark:text-zinc-400">
          <span className="inline-flex min-h-11 items-center">© Xplaind</span>
          {LEGAL.map((l) => (
            <Link key={l.href} href={l.href} className={link}>
              {l.label}
            </Link>
          ))}
          {/* BIZ-1: the business behind the brand. GSTIN, email and phone are on the Contact page. */}
          <span className="inline-flex min-h-11 basis-full items-center sm:ml-auto sm:basis-auto">Xplaind is a brand of {BUSINESS.legalName}</span>
        </div>
      </div>
    </footer>
  );
}
