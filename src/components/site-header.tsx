import Link from "next/link";
import { AccountButton } from "./account-link";
import { BrandLogo } from "./brand-logo";
import { HeaderSearch, XpChip } from "./header-extras";
import { MenuCloser } from "./menu-closer";
import { DesktopNav, PhoneNavLinks } from "./site-nav";

/** The site's top bar. A plain details element opens the phone menu, so it works without JavaScript. */
export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-50 border-b border-violet-100/80 bg-white/70 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-[#0e0b1c]/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="shrink-0" aria-label="Xplaind home">
          <BrandLogo height={22} />
        </Link>
        <nav aria-label="Main" className="hidden md:block">
          <DesktopNav />
        </nav>
        <div className="flex items-center gap-2">
          <HeaderSearch />
          <XpChip />
          <AccountButton className="site-cta hidden sm:inline-flex h-10 items-center rounded-full bg-violet-700 px-4 text-sm font-medium text-white shadow-sm shadow-violet-700/30 hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" />
          <details className="site-menu group relative md:hidden">
            <summary className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Menu</span>
              <span aria-hidden="true" className="flex w-4 flex-col gap-1">
                <span className="h-0.5 rounded bg-current transition group-open:translate-y-[3px] group-open:rotate-45" />
                <span className="h-0.5 rounded bg-current transition group-open:-translate-y-[3px] group-open:-rotate-45" />
              </span>
            </summary>
            {/* NV-3: a full-height menu with the groups, the main action first. */}
            <nav
              aria-label="Main"
              className="fixed inset-x-0 top-14 bottom-0 z-50 flex flex-col gap-6 overflow-y-auto overscroll-contain border-t border-zinc-200 bg-white px-3 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] dark:border-zinc-800 dark:bg-zinc-950"
            >
              <AccountButton className="flex min-h-12 items-center justify-center rounded-full bg-violet-700 px-6 text-base font-medium text-white hover:bg-violet-800" />
              <PhoneNavLinks />
            </nav>
          </details>
          <MenuCloser selector=".site-header details.site-menu" />
        </div>
      </div>
    </header>
  );
}
