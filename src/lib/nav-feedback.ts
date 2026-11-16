/**
 * UX-7: which clicks start a page change, so the top bar (UX-2) and the loading screen know when to show.
 * Pure, so it is unit-tested without a browser.
 */

/** The parts of an `<a>` the check reads. */
export type LinkLike = {
  href: string;
  target?: string;
  hasAttribute?: (name: string) => boolean;
};

/** The parts of `location` the check reads. */
export type HereLike = { href: string; origin: string; pathname: string; search: string };

/** Fired by code that moves to another page itself (router.push), so the loading screen can show too. */
export const NAVIGATE_EVENT = "xp:navigate";

/** True when following this link loads a different page of this site in the same tab. */
export function isPageChangeLink(a: LinkLike | null | undefined, here: HereLike): boolean {
  if (!a || !a.href) return false;
  if (a.target === "_blank" || a.hasAttribute?.("download")) return false;
  let to: URL;
  try {
    to = new URL(a.href, here.href);
  } catch {
    return false;
  }
  if (to.origin !== here.origin) return false;
  if (to.pathname === here.pathname && to.search === here.search) return false; // the same page, or a #anchor on it
  if (to.pathname.startsWith("/go/") || to.pathname.startsWith("/api/")) return false; // these open elsewhere or download
  return true;
}

/** Tell the loading screen that code is about to move to another page. Safe to call anywhere in the browser. */
export function announceNavigation(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(NAVIGATE_EVENT));
}
