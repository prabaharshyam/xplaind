"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { AI_TOOLS, NAV_GROUPS, activeGroup, under } from "@/lib/nav";

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
          <div className="absolute top-full left-0 z-50 mt-3 w-80 rounded-3xl border border-zinc-200 bg-white p-2 shadow-xl shadow-violet-950/10 dark:border-zinc-800 dark:bg-zinc-900">
            <ul>
              {g.items.map((i) => (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    aria-current={current(path, i.href)}
                    className="flex flex-col rounded-2xl px-3 py-2.5 hover:bg-violet-50 aria-[current=page]:bg-violet-50 dark:hover:bg-white/5 dark:aria-[current=page]:bg-white/5"
                  >
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white">{i.label}</span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">{i.note}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </details>
      ))}
      <Link href={AI_TOOLS.href} aria-current={active === "ai" ? "page" : undefined} className={tab(active === "ai")}>
        {AI_TOOLS.label}
        {active === "ai" && dot}
      </Link>
    </div>
  );
}

function PhoneMenu({ path }: { path: string }) {
  const active = activeGroup(path);
  return (
    <div className="flex flex-col gap-6">
      {NAV_GROUPS.map((g) => (
        <section key={g.id} aria-labelledby={`nav-${g.id}`}>
          <p id={`nav-${g.id}`} className={`px-3 text-sm font-semibold ${active === g.id ? "text-violet-800 dark:text-violet-300" : "text-zinc-600 dark:text-zinc-400"}`}>
            {g.label}
          </p>
          <ul className="mt-1">
            {g.items.map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  aria-current={current(path, i.href)}
                  className="flex min-h-12 items-center rounded-2xl px-3 text-base font-medium text-zinc-900 hover:bg-violet-50 aria-[current=page]:bg-violet-50 aria-[current=page]:text-violet-900 dark:text-zinc-100 dark:hover:bg-white/5 dark:aria-[current=page]:bg-white/5 dark:aria-[current=page]:text-white"
                >
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <Link
        href={AI_TOOLS.href}
        aria-current={active === "ai" ? "page" : undefined}
        className="flex min-h-12 items-center rounded-2xl px-3 text-base font-medium text-zinc-900 hover:bg-violet-50 aria-[current=page]:bg-violet-50 dark:text-zinc-100 dark:hover:bg-white/5"
      >
        {AI_TOOLS.label}
      </Link>
    </div>
  );
}
