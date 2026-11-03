"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Engine = {
  gsap: typeof import("gsap").gsap;
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
  lenis: import("lenis").default;
};

/**
 * MO-7: the site's motion system, on every page.
 *
 * - Lenis is the only smooth-scroll engine and drives GSAP's ScrollTrigger.
 * - Headings arrive as you reach them: [data-words] word by word, every other h2 with a wipe.
 * - Card grids rise in with a slight 3D tilt, staggered; [data-rise-group] marks one explicitly.
 * - [data-count] numbers count up, [data-magnetic] buttons lean toward the pointer, the home hero
 *   ([data-hero]) and page titles ([data-hero-title]) run a short intro.
 *
 * Only content below the fold is set up to animate, so nothing on screen jumps at load, and only
 * transforms and clipping move (the hero intro aside), so text keeps its contrast. Under reduced
 * motion none of this runs: no smooth scrolling, everything simply there.
 */
export function SiteMotion() {
  const pathname = usePathname();
  const engine = useRef<Engine | null>(null);
  const [ready, setReady] = useState(false);

  // The engine: once for the whole visit.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let destroy = () => {};
    // A section link clicked before Lenis has loaded jumps natively, while the page may still be
    // settling. Remember it, so Lenis can land on the section where it ends up (see settleAnchor).
    let pending: { target: HTMLElement; at: number } | null = null;
    const remember = (ev: MouseEvent) => {
      const link = (ev.target as Element | null)?.closest?.("a[href^='#']") as HTMLAnchorElement | null;
      const target = link ? document.getElementById(decodeURIComponent(link.hash.slice(1))) : null;
      if (target) pending = { target, at: performance.now() };
    };
    document.addEventListener("click", remember, true);
    void (async () => {
      const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("lenis")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis({ duration: 1.1, smoothWheel: true, allowNestedScroll: true });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      // Content that grows or shrinks (filters, "show more", late images) moves the triggers.
      let timer = 0;
      const ro = new ResizeObserver(() => {
        clearTimeout(timer);
        timer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
      });
      const page = document.getElementById("page");
      if (page) ro.observe(page);
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh);
      void document.fonts?.ready.then(refresh);
      // In-page links (#section) glide there with Lenis. The page can still be settling while the
      // glide runs (a roadmap's sections move by hundreds of pixels as it hydrates), so when it ends
      // we land exactly on the target where it is now, and check once more a moment later.
      const onAnchorClick = (ev: MouseEvent) => {
        if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
        const link = (ev.target as Element | null)?.closest?.("a[href^='#']") as HTMLAnchorElement | null;
        const id = link ? decodeURIComponent(link.hash.slice(1)) : "";
        const target = id ? document.getElementById(id) : null;
        if (!target) return;
        ev.preventDefault();
        pending = null; // Lenis handles this one; its onComplete re-aims.
        history.pushState(null, "", `#${id}`);
        const margin = () => parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        const land = () => {
          target.scrollIntoView({ block: "start" });
          lenis.scrollTo(window.scrollY, { immediate: true, force: true });
        };
        const off = () => Math.abs(target.getBoundingClientRect().top - margin()) > 4;
        lenis.scrollTo(target.getBoundingClientRect().top + window.scrollY - margin(), {
          onComplete: () => {
            if (off()) land();
            window.setTimeout(() => off() && land(), 500);
          },
        });
      };
      document.addEventListener("click", onAnchorClick);
      const settleAnchor = () => {
        if (!pending || performance.now() - pending.at > 6000) return;
        pending.target.scrollIntoView({ block: "start" });
        lenis.scrollTo(window.scrollY, { immediate: true, force: true });
      };
      const settleTimers = [300, 900, 1800].map((ms) => window.setTimeout(settleAnchor, ms));
      engine.current = { gsap, ScrollTrigger, lenis };
      setReady(true);
      destroy = () => {
        clearTimeout(timer);
        ro.disconnect();
        window.removeEventListener("load", refresh);
        document.removeEventListener("click", onAnchorClick);
        settleTimers.forEach(clearTimeout);
        gsap.ticker.remove(tick);
        lenis.destroy();
        engine.current = null;
      };
    })();
    return () => {
      cancelled = true;
      document.removeEventListener("click", remember, true);
      destroy();
    };
  }, []);

  // NV-4: every new page opens at the top. A link clicked while Lenis is still gliding from a
  // scroll would otherwise finish that glide on the new page and land it halfway down. Back and
  // forward keep the position the browser restores, and an address with #section keeps its target.
  const popped = useRef(false);
  const firstPath = useRef(true);
  useEffect(() => {
    const onPop = () => {
      popped.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useLayoutEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    const back = popped.current;
    popped.current = false;
    if (!back && !location.hash) window.scrollTo(0, 0);
    engine.current?.lenis.scrollTo(window.scrollY, { immediate: true, force: true });
  }, [pathname]);

  // The choreography: again for every page.
  useEffect(() => {
    const e = engine.current;
    if (!ready || !e) return;
    let revert = () => {};
    const frame = requestAnimationFrame(() => {
      // The router has moved the page; start the smooth scroller from where the page is now.
      e.lenis.scrollTo(window.scrollY, { immediate: true, force: true });
      const ctx = e.gsap.context(() => choreograph(e));
      e.ScrollTrigger.refresh();
      revert = () => ctx.revert();
    });
    return () => {
      cancelAnimationFrame(frame);
      revert();
    };
  }, [ready, pathname]);

  return null;
}

const below = (el: Element) => el.getBoundingClientRect().top > window.innerHeight * 0.95;
const inside = (el: Element, sel: string) => el.parentElement?.closest(sel) != null;

function choreograph({ gsap, ScrollTrigger }: Engine): () => void {
  const root = document.getElementById("page") ?? document.body;
  const cleanups: (() => void)[] = [];

  // Home hero: the headline's words rise in, then the copy and actions.
  if (root.querySelector("[data-hero]")) {
    gsap.from("[data-hero] [data-word]", { yPercent: 110, opacity: 0, rotateX: -40, duration: 1, ease: "expo.out", stagger: 0.045, delay: 0.1 });
    gsap.from("[data-hero] [data-hero-fade]", { y: 24, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.1, delay: 0.45 });
  }

  // A page title settles into place.
  for (const title of root.querySelectorAll<HTMLElement>("[data-hero-title]")) {
    gsap.from(title, { y: 26, rotateX: -18, transformPerspective: 800, transformOrigin: "50% 100%", duration: 0.9, ease: "expo.out", clearProps: "transform" });
  }

  // Headings split into words.
  for (const heading of root.querySelectorAll<HTMLElement>("[data-words]")) {
    if (inside(heading, "[data-hero]")) continue;
    gsap.from(heading.querySelectorAll("[data-word]"), {
      yPercent: 110,
      opacity: 0,
      duration: 0.9,
      ease: "expo.out",
      stagger: 0.04,
      scrollTrigger: { trigger: heading, start: "top 88%", once: true },
    });
  }

  // Every other section heading below the fold wipes up into view.
  for (const h of root.querySelectorAll<HTMLElement>("h2:not([data-words])")) {
    if (!below(h) || inside(h, "[data-rise],[data-rise-group],dialog,[data-no-motion]")) continue;
    gsap.fromTo(
      h,
      { clipPath: "inset(-10% -5% 100% -5%)", y: 28 },
      {
        clipPath: "inset(-10% -5% -20% -5%)",
        y: 0,
        duration: 0.9,
        ease: "expo.out",
        clearProps: "clipPath,transform",
        scrollTrigger: { trigger: h, start: "top 90%", once: true },
      },
    );
  }

  // Groups marked for it: their [data-rise] children lift in with a 3D tilt.
  for (const group of root.querySelectorAll<HTMLElement>("[data-rise-group]")) {
    gsap.from(group.querySelectorAll("[data-rise]"), {
      y: 70,
      rotateX: 14,
      opacity: 0,
      transformPerspective: 900,
      transformOrigin: "50% 100%",
      duration: 1.1,
      ease: "expo.out",
      stagger: 0.08,
      scrollTrigger: { trigger: group, start: "top 85%", once: true },
    });
  }

  // Any other grid of cards below the fold rises in, a few at a time.
  const cards: HTMLElement[] = [];
  for (const grid of root.querySelectorAll<HTMLElement>(":is(ul,ol,div,section).grid")) {
    if (grid.matches("[data-rise-group]") || inside(grid, "[data-rise-group],[data-rise],dialog,[data-no-motion],.grid") || grid.querySelector(".lx-rise")) continue;
    const kids = [...grid.children].filter((c): c is HTMLElement => c instanceof HTMLElement);
    if (kids.length < 2) continue;
    cards.push(...kids.filter(below));
  }
  if (cards.length) {
    gsap.set(cards, { y: 56, rotateX: 10, transformPerspective: 900, transformOrigin: "50% 100%" });
    ScrollTrigger.batch(cards, {
      start: "top 94%",
      once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, rotateX: 0, duration: 1, ease: "expo.out", stagger: 0.06, overwrite: true, clearProps: "transform" }),
    });
  }

  // Milestone markers slide in.
  for (const gate of root.querySelectorAll<HTMLElement>("[data-gate]")) {
    gsap.from(gate, { x: -30, opacity: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: gate, start: "top 90%", once: true } });
  }

  // Numbers count up to their value, then show the exact original text again.
  for (const el of root.querySelectorAll<HTMLElement>("[data-count]")) {
    const text = el.textContent ?? "";
    const target = Number(text.replace(/[^\d.]/g, ""));
    if (!Number.isFinite(target) || target <= 0) continue;
    const suffix = text.replace(/^[\d,.\s]+/, "");
    const value = { n: 0 };
    gsap.to(value, {
      n: target,
      duration: 1.6,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
      onStart: () => {
        el.textContent = `0${suffix}`;
      },
      onUpdate: () => {
        el.textContent = `${Math.round(value.n).toLocaleString("en-IN")}${suffix}`;
      },
      onComplete: () => {
        el.textContent = text;
      },
    });
    cleanups.push(() => {
      el.textContent = text;
    });
  }

  // Buttons that lean toward the pointer (mouse and trackpad only).
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    for (const el of root.ownerDocument.querySelectorAll<HTMLElement>("[data-magnetic]")) {
      const x = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
      const y = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
      const move = (ev: PointerEvent) => {
        const r = el.getBoundingClientRect();
        x((ev.clientX - (r.left + r.width / 2)) * 0.25);
        y((ev.clientY - (r.top + r.height / 2)) * 0.3);
      };
      const leave = () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      cleanups.push(() => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
        gsap.set(el, { clearProps: "transform" });
      });
    }
  }

  return () => {
    for (const c of cleanups) c();
  };
}
