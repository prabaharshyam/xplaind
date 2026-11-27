"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Icon } from "@/components/art/icons";
import { useAccountState } from "@/components/account-link";
import { APP_HINT, frameFor } from "@/lib/app-frame";
import { NAV_GROUPS, RAIL, activeRail } from "@/lib/nav";
import { TILE } from "@/lib/tones";
import { MenuCloser } from "@/components/menu-closer";
import { XMark } from "@/components/x-mark";

/**
 * APP-1: keeps <html data-frame> right. The pre-paint script (APP_SCRIPT) guesses from the hint stored on this device;
 * once the account is known this sets or clears the hint and the frame, on every page change too. Presentation only.
 */
export function AppFrameSync() {
  const path = usePathname() ?? "/";
  const state = useAccountState();
  useEffect(() => {
    if (state === "unknown") return; // keep the first paint's guess until the account check answers
    const signedIn = state === "in";
    try {
      if (signedIn) localStorage.setItem(APP_HINT, "1");
      else localStorage.removeItem(APP_HINT);
    } catch {
      // Storage blocked: the frame still follows the account below, it just cannot be guessed before paint.
    }
    const frame = frameFor(path, signedIn);
    if (frame === "app") document.documentElement.dataset.frame = "app";
    else delete document.documentElement.dataset.frame;
  }, [path, state]);
  return null;
}

/** The page's place and name for the app's top bar, from the menu. */
export function AppTitle() {
  const path = usePathname() ?? "/";
  const place = RAIL.find((r) => r.id === activeRail(path));
  const item = NAV_GROUPS.flatMap((g) => g.items)
    .filter((i) => path === i.href || path.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  if (!place) return null;
  return (
    <p className="app-only min-w-0 items-center gap-2 truncate text-sm">
      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{place.label}</span>
      {item && item.label !== place.label && (
        <>
          <span aria-hidden="true" className="text-zinc-400">/</span>
          <span className="truncate text-zinc-600 dark:text-zinc-400">{item.label}</span>
        </>
      )}
    </p>
  );
}

/**
 * APP-1: the app's side rail, from 640 px wide, signed in only (globals.css shows it under html[data-frame=app]).
 * Light, to match the pastel site (UX-23); each place shows its pages on hover or keyboard focus. The marketing footer
 * is not shown in the app, so its help and policy links live at the foot of the rail.
 */
export function AppRail() {
  const path = usePathname() ?? "/";
  const current = activeRail(path);
  const flyout =
    "pointer-events-none invisible absolute top-0 left-full z-50 pl-3 opacity-0 transition-[opacity,visibility] duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100";
  const row = "flex min-h-11 flex-col justify-center rounded-2xl px-3 py-2 transition-colors duration-150 hover:bg-white/80 aria-[current=page]:bg-white/90 aria-[current=page]:ring-1 aria-[current=page]:ring-zinc-200 dark:hover:bg-white/[0.08] dark:aria-[current=page]:bg-white/10 dark:aria-[current=page]:ring-white/10";
  const pageRow = "flex min-h-11 items-center gap-3 rounded-2xl px-2.5 py-2 transition-colors duration-150 hover:bg-white/80 aria-[current=page]:bg-white/90 aria-[current=page]:ring-1 aria-[current=page]:ring-zinc-200 dark:hover:bg-white/[0.08] dark:aria-[current=page]:bg-white/10 dark:aria-[current=page]:ring-white/10";
  return (
    <nav aria-label="App" className="app-rail fixed inset-y-0 left-0 z-40 w-20 flex-col items-center border-r border-zinc-200 bg-[var(--hero)] py-3 print:hidden dark:border-white/10 dark:bg-zinc-950">
      <Link href="/dashboard" aria-label="Xplaind home" className="grid size-12 place-items-center rounded-2xl hover:bg-white/70 dark:hover:bg-white/10">
        <XMark size={30} />
      </Link>
      <ul className="mt-4 flex flex-col gap-1">
        {RAIL.map((r) => {
          const on = current === r.id;
          return (
            <li key={r.id} className="group relative">
              <Link
                href={r.href}
                aria-current={on ? "page" : undefined}
                className="flex w-16 flex-col items-center gap-1 rounded-2xl py-2 text-xs font-medium text-zinc-600 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-brand-700 aria-[current]:text-zinc-950 dark:text-zinc-400 dark:hover:text-white dark:aria-[current]:text-white"
              >
                <span
                  aria-hidden="true"
                  className={`app-tile lx-pop grid size-10 place-items-center rounded-2xl ${on ? TILE[r.tone] : "bg-transparent group-hover:bg-white/80 dark:group-hover:bg-white/10"}`}
                >
                  <Icon name={r.icon} size={20} />
                </span>
                {r.label}
              </Link>
              {r.items.length > 0 && (
                <div className={flyout}>
                  <div className="xp-glass-strong w-80 rounded-3xl p-2">
                    <p className="px-3 pt-1 pb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{r.label}</p>
                    {/* APP-7 (owner, 2026-11-27: the sub-menu "looks like a list of texts"): each page with its coloured icon
                        tile, as in the website menu, a soft highlight on hover and the tile's pop (APP-2). */}
                    <ul>
                      {r.items.map((i) => (
                        <li key={i.href}>
                          <Link href={i.href} aria-current={path === i.href ? "page" : undefined} className={pageRow}>
                            <span aria-hidden="true" className={`lx-pop grid size-10 shrink-0 place-items-center rounded-2xl ${TILE[i.tone]}`}>
                              <Icon name={i.icon} size={18} />
                            </span>
                            <span className="flex min-w-0 flex-col">
                              <span className="text-sm font-semibold text-zinc-900 dark:text-white">{i.label}</span>
                              <span className="truncate text-sm text-zinc-600 dark:text-zinc-400">{i.note}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {/* A <details>, so Help opens on a tap (touch screens) as well as on hover. */}
      <details className="app-help group relative mt-auto">
        <summary className="flex w-16 cursor-pointer list-none flex-col items-center gap-1 rounded-2xl py-2 text-xs font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white [&::-webkit-details-marker]:hidden">
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-2xl text-base font-semibold group-hover:bg-white/80 group-open:bg-white/80 dark:group-hover:bg-white/10 dark:group-open:bg-white/10">
            ?
          </span>
          Help
        </summary>
        <div className="absolute bottom-0 left-full z-50 pl-3">
          <ul className="xp-glass-strong w-60 rounded-3xl p-2">
            {[
              { href: "/pricing", label: "Plans and pricing" },
              { href: "/contact", label: "Help and contact" },
              { href: "/settings", label: "Settings" },
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
              { href: "/refunds", label: "Refunds and cancellations" },
              { href: "/explore", label: "All pages" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={`${row} text-sm font-medium text-zinc-900 dark:text-zinc-100`}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </details>
      <MenuCloser selector=".app-rail details.app-help" />
    </nav>
  );
}
