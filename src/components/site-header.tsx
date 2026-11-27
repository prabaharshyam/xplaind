import Link from "next/link";
import { AccountButton, AccountMenu, ClaimOnSignIn, SignInLink, SignedInLinks } from "./account-link";
import { BrandLogo } from "./brand-logo";
import { FocusTimer } from "./focus-timer";
import { HeaderSearch, XpChip } from "./header-extras";
import { MenuCloser } from "./menu-closer";
import { HeaderDock } from "./header-dock";
import { ThemeToggle } from "./theme-toggle";
import { DesktopNav, PhoneNavLinks } from "./site-nav";

/**
 * The site's top bar. A plain details element opens the phone menu, so it works without JavaScript.
 * GL-1 (owner request, 2026-11-17, mock-up): a floating capsule of glass over the page (globals.css,
 * .xp-glass); the page scrolls under it and shows through, blurred. The header itself is transparent
 * and lets clicks through around the capsule.
 */
export function SiteHeader() {
  return (
    <header className="site-header pointer-events-none sticky top-0 z-50 px-2 pt-2 md:px-4 md:pt-3">
      <div className="xp-glass pointer-events-auto relative mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-full pr-1.5 pl-4 md:pr-2 md:pl-5">
        <Link href="/" className="shrink-0" aria-label="Xplaind home">
          <BrandLogo height={22} className="max-sm:[&_img]:h-[17px] max-sm:[&_img]:w-auto" />
        </Link>
        {/* NV-9 (2026-11-18, site review: the bar was cut off at 768 to 1100 px): the full menu only from
            1120 px, where it fits; below that, the phone menu. */}
        <nav aria-label="Main" className="hidden min-[1120px]:block">
          <DesktopNav />
        </nav>
        {/* FC-1: a smaller logo and tighter gaps on phones, so the running timer and the streak fit at 360 px. */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <HeaderSearch />
          <FocusTimer />
          <XpChip />
          <SignInLink className="xp-glass-btn hidden h-10 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap text-zinc-900 sm:inline-flex dark:text-zinc-100" />
          <AccountButton className="site-cta hidden sm:inline-flex h-10 items-center rounded-full whitespace-nowrap bg-brand-700 px-4 text-sm font-medium text-white shadow-sm shadow-brand-700/30 hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700" />
          <AccountMenu />
          <ClaimOnSignIn />
          {/* BR-6: top right on larger screens; on phones it is a row in the menu, so the bar fits 360 px. */}
          <ThemeToggle className="hidden sm:grid" />
          <details className="site-menu group relative min-[1120px]:hidden">
            <summary className="xp-glass-btn flex size-11 cursor-pointer list-none items-center justify-center rounded-full [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Menu</span>
              <span aria-hidden="true" className="flex w-4 flex-col gap-1">
                <span className="h-0.5 rounded bg-current transition group-open:translate-y-[3px] group-open:rotate-45" />
                <span className="h-0.5 rounded bg-current transition group-open:-translate-y-[3px] group-open:-rotate-45" />
              </span>
            </summary>
            {/* NV-3: a full-height menu with the groups, the main action first. */}
            {/* GL-1: the glass is on the sheet, which stays still; only the inner list scrolls. Glass drawn on a
                scrolling element scrolls away with its content and leaves the lower links bare (owner report,
                iPhone, 17 Nov). */}
            <nav aria-label="Main" className="xp-glass-strong fixed inset-x-2 top-[4.5rem] bottom-2 z-50 flex flex-col rounded-[2rem] sm:left-auto sm:w-[26rem] md:top-[4.75rem] md:right-4">
              <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain rounded-[2rem] px-3 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <AccountButton className="flex min-h-12 items-center justify-center rounded-full bg-brand-700 px-6 text-base font-medium text-white hover:bg-brand-800" />
              <SignInLink
                label="Sign in"
                className="xp-glass-btn -mt-3 flex min-h-12 items-center justify-center rounded-full px-6 text-base font-medium text-brand-950 dark:text-brand-100"
              />
              <PhoneNavLinks />
              <ThemeToggle labelled />
              <div className="flex flex-col gap-2 border-t border-black/10 pt-4 empty:hidden dark:border-white/10">
                <SignedInLinks
                  linkClass="flex min-h-12 items-center rounded-2xl px-3 text-base font-medium text-zinc-900 hover:bg-brand-50 dark:text-zinc-100 dark:hover:bg-white/5"
                  buttonClass="flex min-h-12 w-full items-center rounded-2xl px-3 text-left text-base font-medium text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-white/5"
                />
              </div>
              </div>
            </nav>
          </details>
          <MenuCloser selector=".site-header details.site-menu" />
          <HeaderDock />
        </div>
      </div>
    </header>
  );
}
