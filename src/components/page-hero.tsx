import Link from "next/link";
import type { ReactNode } from "react";
import { Cover } from "@/components/art/cover";
import type { IconName, ThemeId } from "@/lib/themes";

/** A page's banner: picture, title and one line on what the page is for. */
export function PageHero({
  theme,
  seed,
  icon,
  eyebrow,
  title,
  lead,
  crumbs = [],
  children,
}: {
  theme: ThemeId;
  seed: string;
  icon?: IconName;
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  crumbs?: { href: string; label: string }[];
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:gap-10 md:px-6 md:py-12">
        <div className="min-w-0 flex-1">
          {crumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
              {crumbs.map((c, i) => (
                <span key={c.href}>
                  {i > 0 && " / "}
                  <Link href={c.href} className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-white">
                    {c.label}
                  </Link>
                </span>
              ))}
            </nav>
          )}
          {eyebrow && <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">{eyebrow}</p>}
          <h1 className="mt-1 text-3xl leading-tight font-semibold tracking-tight text-balance md:text-4xl">{title}</h1>
          {lead && <div className="mt-3 max-w-2xl text-lg leading-8 text-zinc-700 dark:text-zinc-300">{lead}</div>}
          {children && <div className="mt-5">{children}</div>}
        </div>
        {/* MO-2, MO-3: the picture floats, tilts toward the pointer and tips back as the page scrolls. */}
        <div className="lx-hero-art shrink-0 [perspective:1000px]">
          <div data-tilt="12" className="lx-bob">
            <Cover theme={theme} seed={seed} icon={icon} className="h-36 w-full rounded-3xl shadow-xl md:h-48 md:w-80" iconSize={52} />
          </div>
        </div>
      </div>
    </header>
  );
}
