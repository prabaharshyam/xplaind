import Link from "next/link";
import { AccountButton, AccountMenu, SignInLink, SignedInLinks } from "./account-link";
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
          <SignInLink className="hidden h-10 items-center rounded-full px-3 text-sm font-medium text-zinc-800 hover:bg-violet-50 hover:text-violet-950 sm:inline-flex dark:text-zinc-200 dark:hover:bg-white/10" />
          <AccountButton className="site-cta hidden sm:inline-flex h-10 items-center rounded-full bg-violet-700 px-4 text-sm font-medium text-white shadow-sm shadow-violet-700/30 hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700" />
          <AccountMenu />
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
              <SignInLink
                label="Sign in or create an account"
                className="-mt-3 flex min-h-12 items-center justify-center rounded-full border border-violet-200 bg-white px-6 text-base font-medium text-violet-950 hover:bg-violet-50 dark:border-violet-800 dark:bg-zinc-900 dark:text-violet-100"
              />
              <PhoneNavLinks />
              <div className="flex flex-col gap-2 border-t border-zinc-200 pt-4 empty:hidden dark:border-zinc-800">
                <SignedInLinks
                  linkClass="flex min-h-12 items-center rounded-2xl px-3 text-base font-medium text-zinc-900 hover:bg-violet-50 dark:text-zinc-100 dark:hover:bg-white/5"
                  buttonClass="flex min-h-12 w-full items-center rounded-2xl px-3 text-left text-base font-medium text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-white/5"
                />
              </div>
            </nav>
          </details>
          <MenuCloser selector=".site-header details.site-menu" />
        </div>
      </div>
    </header>
  );
}
