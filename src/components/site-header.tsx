import Link from "next/link";
import { AccountButton } from "./account-link";
import { HeaderSearch, XpChip } from "./header-extras";

const NAV = [
  { href: "/paths", label: "Roadmaps" },
  { href: "/library", label: "Library" },
  { href: "/videos", label: "Videos" },
  { href: "/practice", label: "Practice" },
  { href: "/interview/simulator", label: "Mock interview" },
  { href: "/ai", label: "AI tools" },
  { href: "/community", label: "Community" },
];

/** The site's top bar. A plain details element opens the phone menu, so it works without JavaScript. */
export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-50 border-b border-violet-100/80 bg-white/70 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-[#0e0b1c]/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="text-[15px] font-semibold tracking-tight" aria-label="Xplaind home">
          Xplaind
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 text-[13px] text-zinc-700 md:flex dark:text-zinc-300">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-black dark:hover:text-white">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <HeaderSearch />
          <XpChip />
          <AccountButton className="site-cta hidden sm:inline-flex h-9 items-center rounded-full bg-violet-700 px-4 text-[13px] font-medium text-white shadow-sm shadow-violet-700/30 hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" />
          <details className="group relative md:hidden">
            <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Menu</span>
              <span aria-hidden="true" className="flex w-4 flex-col gap-1">
                <span className="h-0.5 rounded bg-current transition group-open:translate-y-[3px] group-open:rotate-45" />
                <span className="h-0.5 rounded bg-current transition group-open:-translate-y-[3px] group-open:-rotate-45" />
              </span>
            </summary>
            <nav
              aria-label="Main"
              className="absolute right-0 mt-2 flex w-56 flex-col rounded-2xl border border-black/5 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-zinc-900"
            >
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-xl px-3 py-3 text-[15px] hover:bg-black/5 dark:hover:bg-white/10">
                  {n.label}
                </Link>
              ))}
              <AccountButton className="mt-1 rounded-xl bg-violet-700 px-3 py-3 text-center text-[15px] font-medium text-white" />
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
