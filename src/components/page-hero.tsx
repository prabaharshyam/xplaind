import Link from "next/link";
import type { ReactNode } from "react";
import { ParticleScene } from "@/components/three/particle-scene";
import { type ParticleShape, THEME_SHAPE } from "@/components/three/particle-shapes";
import { type IconName, type ThemeId, particleColorsOf, themeOf } from "@/lib/themes";

/**
 * A page's banner: picture, title and one line on what the page is for. "compact" (the default)
 * suits pages people come to for their content, such as the library, lists and guides: it is short
 * and leaves out the sculpture on phones so the content starts on the first screen. "full" is for
 * hub pages, where the sculpture is part of the welcome.
 */
export function PageHero({
  theme,
  size = "compact",
  icon,
  shape,
  eyebrow,
  title,
  lead,
  crumbs = [],
  children,
}: {
  theme: ThemeId;
  /** Kept for callers; the road panel needs only the theme. */
  seed?: string;
  icon?: IconName;
  /** The particle sculpture that stands for this page; defaults to the theme's. */
  shape?: ParticleShape;
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  crumbs?: { href: string; label: string }[];
  children?: ReactNode;
  size?: "compact" | "full";
}) {
  const full = size === "full";
  return (
    <header className="relative overflow-hidden border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className={`mx-auto flex max-w-6xl flex-col px-4 md:flex-row md:items-center md:gap-10 md:px-6 ${full ? "gap-4 py-8 md:py-12" : "gap-4 py-6 md:py-8"}`}>
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
          {eyebrow && <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">{eyebrow}</p>}
          <h1 data-hero-title className="mt-1 text-3xl leading-tight font-semibold tracking-tight text-balance md:text-[2.75rem] md:leading-[1.1]">{title}</h1>
          {lead && <div className={`mt-3 max-w-2xl text-zinc-700 dark:text-zinc-300 ${full ? "text-lg leading-8" : "text-base leading-7 md:text-lg md:leading-8"}`}>{lead}</div>}
          {children && <div className={full ? "mt-5" : "mt-4"}>{children}</div>}
        </div>
        {/* MO-8: the page's own particle sculpture, in its theme's colours. */}
        <div className={`lx-hero-art shrink-0 [perspective:1000px] ${full ? "" : "max-md:hidden"}`}>
          <ParticleScene shape={shape ?? THEME_SHAPE[theme]} colors={particleColorsOf(theme)} icon={icon ?? themeOf(theme).icon} className={full ? "h-44 w-full md:h-72 md:w-[26rem]" : "h-52 w-80"} />
        </div>
      </div>
    </header>
  );
}
