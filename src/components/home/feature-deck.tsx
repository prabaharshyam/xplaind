"use client";

import Link from "next/link";
import { type KeyboardEvent, type PointerEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/art/icons";
import { primaryButton, primaryButtonSm, secondaryButton } from "@/components/ui";

export type DeckTone = "violet" | "emerald" | "sky" | "amber" | "rose" | "teal";

export type DeckCard = {
  id: string;
  /** Short name on the tab. */
  tab: string;
  eyebrow: string;
  title: string;
  text: string;
  points?: string[];
  cta: { href: string; label: string };
  more?: { href: string; label: string };
  tone: DeckTone;
  visual: ReactNode;
};

const TONE: Record<DeckTone, string> = {
  violet: "bg-violet-100 dark:bg-violet-950",
  emerald: "bg-emerald-100 dark:bg-emerald-950",
  sky: "bg-sky-100 dark:bg-sky-950",
  amber: "bg-amber-100 dark:bg-amber-950",
  rose: "bg-rose-100 dark:bg-rose-950",
  teal: "bg-teal-100 dark:bg-teal-950",
};

/** Where a card sits relative to the one in front: 0 is the front, 1 to 3 fan out behind, the last has just left. */
function pose(offset: number, count: number): React.CSSProperties {
  if (offset === 0) return { transform: "translate3d(0,0,0) rotate(0deg) scale(1)", opacity: 1, zIndex: count + 1 };
  if (offset === count - 1) return { transform: "translate3d(-115%, 6%, 0) rotate(-9deg) scale(0.96)", opacity: 0, zIndex: count + 2 };
  const k = Math.min(offset, 4);
  return {
    transform: `translate3d(${k * 3.2}%, ${k * 2.2}%, 0) rotate(${k * 2.4}deg) scale(${1 - k * 0.035})`,
    opacity: k > 3 ? 0 : 1,
    zIndex: count - offset,
  };
}

/**
 * UX-4: the home page's features as a deck of cards. Tabs pick a card; the one in front slides away
 * and the next comes forward from the fanned stack. Swipe on phones. Under reduced motion the cards
 * simply swap, and the deck never moves by itself.
 */
export function FeatureDeck({ cards }: { cards: DeckCard[] }) {
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const base = useId();
  const n = cards.length;

  const go = (i: number, focus = false) => {
    const next = (i + n) % n;
    setActive(next);
    setTouched(true);
    if (focus) tabs.current[next]?.focus();
  };

  // Gentle autoplay while the deck is on screen, until the visitor touches it. Never under reduced motion.
  useEffect(() => {
    const el = root.current;
    if (!el || touched || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    const t = window.setInterval(() => visible && document.visibilityState === "visible" && setActive((a) => (a + 1) % n), 6500);
    return () => {
      io.disconnect();
      window.clearInterval(t);
    };
  }, [touched, n]);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: n - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    go(to, true);
  };

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse") return;
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = (e: PointerEvent) => {
    const start = drag.current;
    drag.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - start.y) * 1.5) go(active + (dx < 0 ? 1 : -1));
  };

  return (
    <div ref={root} onPointerEnter={() => setTouched(true)}>
      <div
        role="tablist"
        aria-label="Features"
        className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:rounded-full md:border md:border-zinc-200 md:bg-white md:p-1.5 md:dark:border-zinc-800 md:dark:bg-zinc-900"
      >
        {cards.map((c, i) => {
          const on = i === active;
          return (
            <button
              key={c.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              id={`${base}-tab-${c.id}`}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls={`${base}-panel-${c.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => go(i)}
              onKeyDown={(e) => onKey(e, i)}
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-medium whitespace-nowrap transition md:flex-1 ${
                on
                  ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 md:border-transparent md:bg-transparent dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10 md:dark:bg-transparent"
              }`}
            >
              {c.tab}
            </button>
          );
        })}
      </div>

      <div className="relative mt-8 overflow-x-clip pr-3 pb-4 md:mt-12 md:pr-10 md:pb-8" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => (drag.current = null)}>
        <div className="grid grid-cols-[minmax(0,1fr)] [&>*]:[grid-area:1/1]">
          {cards.map((c, i) => {
            const offset = (i - active + n) % n;
            const front = offset === 0;
            return (
              <article
                key={c.id}
                id={`${base}-panel-${c.id}`}
                role="tabpanel"
                aria-labelledby={`${base}-tab-${c.id}`}
                aria-hidden={!front}
                inert={!front}
                style={pose(offset, n)}
                className={`deck-card grid min-w-0 origin-bottom-left grid-cols-[minmax(0,1fr)] content-start gap-4 rounded-[2rem] p-5 shadow-[0_30px_60px_-30px_rgba(46,16,101,0.35),0_10px_24px_-14px_rgba(0,0,0,0.18)] md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:content-normal md:items-center md:gap-8 md:p-10 ${TONE[c.tone]}`}
              >
                <div>
                  <p className="hidden text-sm font-semibold text-zinc-700 md:block dark:text-zinc-300">{c.eyebrow}</p>
                  <h3 className="text-2xl leading-tight font-semibold tracking-tight text-balance md:mt-2 md:text-4xl">{c.title}</h3>
                  <p className="mt-2 line-clamp-3 text-base leading-7 text-zinc-800 md:mt-3 md:line-clamp-none md:text-lg md:leading-8 dark:text-zinc-200">{c.text}</p>
                  {c.points && (
                    <ul className="mt-4 hidden flex-col gap-2 md:flex">
                      {c.points.map((p) => (
                        <li key={p} className="flex items-start gap-2.5 leading-7">
                          <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-white/80 text-zinc-900 dark:bg-white/15 dark:text-white">
                            <Icon name="tick" size={12} />
                          </span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 md:mt-6 md:gap-3">
                    <span className="contents md:hidden">
                      <Link href={c.cta.href} className={primaryButtonSm}>
                        {c.cta.label}
                      </Link>
                    </span>
                    <span className="hidden md:contents">
                      <Link href={c.cta.href} className={primaryButton}>
                        {c.cta.label}
                      </Link>
                    </span>
                    {c.more && (
                      <>
                        {/* Phones: a quiet text link, so both actions fit on one line. */}
                        <Link href={c.more.href} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold whitespace-nowrap text-zinc-900 underline-offset-4 hover:underline md:hidden dark:text-white">
                          {c.more.label} <span aria-hidden="true">→</span>
                        </Link>
                        <span className="hidden md:contents">
                          <Link href={c.more.href} className={`${secondaryButton} bg-white/70 dark:bg-white/10`}>
                            {c.more.label}
                          </Link>
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="deck-visual min-w-0 overflow-hidden rounded-3xl bg-white/80 p-3 shadow-sm ring-1 ring-black/5 md:overflow-visible md:p-6 dark:bg-zinc-900/70 dark:ring-white/10">{c.visual}</div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3 md:hidden" aria-hidden="true">
        {cards.map((c, i) => (
          <span key={c.id} className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-zinc-900 dark:bg-white" : "w-1.5 bg-zinc-300 dark:bg-zinc-700"}`} />
        ))}
      </div>
    </div>
  );
}
