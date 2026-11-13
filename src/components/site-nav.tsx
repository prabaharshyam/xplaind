"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { Icon } from "@/components/art/icons";
import { NAV_GROUPS, type NavTone, activeGroup, under } from "@/lib/nav";
import type { IconName } from "@/lib/themes";

/** UX-3: the soft icon tile beside each menu item, one tone per item. */
const TONE: Record<NavTone, string> = {
  violet: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200",
  indigo: "bg-violet-50 text-violet-900 ring-1 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-100 dark:ring-violet-500/30",
  sky: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200",
  teal: "bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200",
  emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
  rose: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200",
};

function Tile({ icon, tone, size = "size-10" }: { icon: IconName; tone: NavTone; size?: string }) {
  return (
    <span aria-hidden="true" className={`grid ${size} shrink-0 place-items-center rounded-2xl transition group-hover/item:scale-105 ${TONE[tone]}`}>
      <Icon name={icon} size={18} />
    </span>
  );
}

const current = (path: string, href: string) => (under(path, href) ? ("page" as const) : undefined);

// Reading the address needs a Suspense boundary on pages with dynamic addresses; until it is known,
// the same menu shows with no section marked.
const Here = ({ children }: { children: (path: string) => React.ReactNode }) => <>{children(usePathname())}</>;

/** Desktop: one dropdown per group. Plain <details>, so the menus open without JavaScript too. */
export function DesktopNav() {
  return (
    <Suspense fallback={<DesktopMenus path="" />}>
      <Here>{(path) => <DesktopMenus path={path} />}</Here>
    </Suspense>
  );
}

/** Phones: the same groups in one full-height list, with the current page marked. */
export function PhoneNavLinks() {
  return (
    <Suspense fallback={<PhoneMenu path="" />}>
      <Here>{(path) => <PhoneMenu path={path} />}</Here>
    </Suspense>
  );
}

function DesktopMenus({ path }: { path: string }) {
  const active = activeGroup(path);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const menus = () => [...el.querySelectorAll<HTMLDetailsElement>("details")];
    const closeAll = (except?: Element | null) => menus().forEach((d) => d !== except && (d.open = false));
    // Opening one closes the others; a click outside, a link, or Escape closes them all.
    const onToggle = (e: Event) => {
      const d = e.target as HTMLDetailsElement;
      if (d.open) closeAll(d);
    };
    const onDocClick = (e: MouseEvent) => {
      if (!el.contains(e.target as Node) || (e.target as HTMLElement).closest("a")) closeAll();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const open = menus().find((d) => d.open);
      if (open) {
        open.open = false;
        open.querySelector("summary")?.focus();
      }
    };
    el.addEventListener("toggle", onToggle, true);
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("toggle", onToggle, true);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Close any open menu after a navigation.
  useEffect(() => {
    root.current?.querySelectorAll("details").forEach((d) => (d.open = false));
  }, [path]);

  const tab = (on: boolean) =>
    `relative flex h-10 items-center gap-1 rounded-full px-3 text-sm transition hover:bg-violet-50 hover:text-violet-950 dark:hover:bg-white/10 dark:hover:text-white ${
      on ? "font-semibold text-violet-900 dark:text-white" : "text-zinc-700 dark:text-zinc-300"
    }`;
  const dot = <span aria-hidden="true" className="absolute inset-x-3 -bottom-[9px] h-0.5 rounded-full bg-violet-700 dark:bg-violet-300" />;

  return (
    <div ref={root} className="flex items-center gap-1">
      {NAV_GROUPS.map((g) => (
        <details key={g.id} className="group relative">
          <summary className={`${tab(active === g.id)} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
            {g.label}
            <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3 transition group-open:rotate-180">
              <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {active === g.id && dot}
            {active === g.id && <span className="sr-only"> (current section)</span>}
          </summary>
          <div
            className={`nav-panel absolute top-full left-0 z-50 mt-3 rounded-3xl border border-zinc-200/80 bg-white p-3 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18),0_8px_20px_-12px_rgba(0,0,0,0.15)] dark:border-zinc-800 dark:bg-zinc-900 ${
              g.items.length > 4 ? "w-[38rem]" : "w-[22rem]"
            }`}
          >
            <p className="px-3 pt-1 pb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">{g.label}</p>
            <ul className={g.items.length > 4 ? "grid grid-cols-2 gap-1" : "flex flex-col gap-1"}>
              {g.items.map((i) => (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    aria-current={current(path, i.href)}
                    className="group/item flex items-start gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-zinc-50 aria-[current=page]:bg-violet-50 dark:hover:bg-white/5 dark:aria-[current=page]:bg-white/5"
                  >
                    <Tile icon={i.icon} tone={i.tone} />
                    <span className="flex flex-col pt-0.5">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-white">{i.label}</span>
                      <span className="text-[13px] leading-5 text-zinc-600 dark:text-zinc-400">{i.note}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </details>
      ))}
    </div>
  );
}

/**
 * NV-6 (owner request, 2026-11-13): the phone menu as a set of big, numbered rows that unfold.
 * Each group is a row: a mono number (the road-marker signature), the name in the display face and a
 * hint of what is inside. Tapping a row unfolds its links as tiles that cascade in, the plus turns
 * into a minus and the other rows step back. One group open at a time; the group you are in starts
 * open. The rows rise in one after another when the menu opens (globals.css, .site-menu[open]).
 * Under reduced motion everything simply appears.
 */
function PhoneMenu({ path }: { path: string }) {
  const active = activeGroup(path);
  const [open, setOpen] = useState<string | null>(active ?? null);
  // A new page opens its own group (adjusted during render, not in an effect).
  const [seen, setSeen] = useState(active);
  if (seen !== active) {
    setSeen(active);
    setOpen(active ?? null);
  }

  return (
    <div className="flex flex-col gap-1">
      {NAV_GROUPS.map((g, gi) => {
        const isOpen = open === g.id;
        const dim = open !== null && !isOpen;
        const panelId = `phone-nav-${g.id}`;
        return (
          <div key={g.id} data-nav-row style={{ "--i": gi } as React.CSSProperties} className={`transition-opacity duration-300 ${dim ? "opacity-45" : "opacity-100"}`}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : g.id)}
              className="group/row flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
            >
              <span aria-hidden="true" className={`w-6 shrink-0 font-mono text-xs tabular-nums transition-colors duration-300 ${isOpen || active === g.id ? "text-violet-700 dark:text-violet-300" : "text-zinc-400 dark:text-zinc-500"}`}>
                {String(gi + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block font-display text-[1.75rem] leading-9 font-semibold tracking-tight transition-colors duration-300 ${active === g.id ? "text-violet-800 dark:text-violet-300" : "text-zinc-950 dark:text-white"}`}>
                  {g.label}
                </span>
                <span className="block truncate text-sm text-zinc-500 dark:text-zinc-400">{g.items.map((i) => i.label).join(" · ")}</span>
              </span>
              <span
                aria-hidden="true"
                className={`relative grid size-10 shrink-0 place-items-center rounded-full border transition-[background-color,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isOpen ? "rotate-180 border-violet-700 bg-violet-700 text-white dark:border-violet-400 dark:bg-violet-400 dark:text-zinc-950" : "border-zinc-300 text-zinc-700 group-active/row:scale-95 dark:border-zinc-700 dark:text-zinc-200"
                }`}
              >
                <span className="absolute h-[1.5px] w-3.5 rounded-full bg-current" />
                <span className={`absolute h-3.5 w-[1.5px] rounded-full bg-current transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? "scale-y-0" : "scale-y-100"}`} />
              </span>
            </button>
            {/* The panel unfolds by animating its grid row from 0fr to 1fr, so it needs no measuring. */}
            <div
              id={panelId}
              inert={!isOpen}
              className={`grid transition-[grid-template-rows,visibility] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${isOpen ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]"}`}
            >
              <ul className="min-h-0 overflow-hidden">
                <li className="grid grid-cols-2 gap-2 px-3 pt-1 pb-4">
                  {g.items.map((i, ii) => (
                    <Link
                      key={i.href}
                      href={i.href}
                      aria-current={current(path, i.href)}
                      style={{ transitionDelay: isOpen ? `${80 + ii * 40}ms` : "0ms" }}
                      className={`group/item flex min-h-[4.5rem] flex-col justify-between gap-2 rounded-2xl bg-zinc-100 p-3 text-sm font-medium text-zinc-900 transition-[opacity,transform,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-zinc-200 aria-[current=page]:bg-violet-700 aria-[current=page]:text-white motion-reduce:transition-none dark:bg-white/[0.06] dark:text-zinc-100 dark:hover:bg-white/10 dark:aria-[current=page]:bg-violet-500 ${
                        isOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                      }`}
                    >
                      <Tile icon={i.icon} tone={i.tone} size="size-8" />
                      <span className="leading-5">{i.label}</span>
                    </Link>
                  ))}
                </li>
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
