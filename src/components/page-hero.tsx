import Link from "next/link";
import type { ReactNode } from "react";
import { ParticleScene } from "@/components/three/particle-scene";
import { type ParticleShape, THEME_SHAPE } from "@/components/three/particle-shapes";
import { type IconName, type ThemeId, particleColorsOf, themeOf } from "@/lib/themes";

/** A page's banner: picture, title and one line on what the page is for. */
export function PageHero({
  theme,
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
}) {
  return (
    <header className="relative overflow-hidden border-b border-violet-100 bg-gradient-to-br from-violet-100/80 via-white/40 to-pink-100/70 dark:border-violet-950 dark:from-violet-950/60 dark:via-transparent dark:to-fuchsia-950/40">
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
          {eyebrow && <p className="text-sm font-medium text-violet-800 dark:text-violet-300">{eyebrow}</p>}
          <h1 data-hero-title className="mt-1 text-3xl leading-tight font-semibold tracking-tight text-balance md:text-4xl">{title}</h1>
          {lead && <div className="mt-3 max-w-2xl text-lg leading-8 text-zinc-700 dark:text-zinc-300">{lead}</div>}
          {children && <div className="mt-5">{children}</div>}
        </div>
        {/* MO-8: the page's own particle sculpture, in its theme's colours. */}
        <div className="lx-hero-art shrink-0 [perspective:1000px]">
          <ParticleScene shape={shape ?? THEME_SHAPE[theme]} colors={particleColorsOf(theme)} icon={icon ?? themeOf(theme).icon} className="h-56 w-full md:h-72 md:w-[26rem]" />
        </div>
      </div>
    </header>
  );
}
