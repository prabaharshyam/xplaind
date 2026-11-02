"use client";

import { Fragment, useEffect } from "react";

/**
 * MO-6: the home page's motion system. Lenis is the only smooth-scroll engine and drives GSAP's
 * ScrollTrigger. Headings marked data-words reveal word by word, blocks marked data-rise lift in
 * with a slight 3D tilt, and the hero runs a short intro. Content is complete without JavaScript;
 * under reduced motion nothing moves and no smooth scrolling is added.
 */
export function HomeMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cleanup = () => {};
    let cancelled = false;

    void (async () => {
      const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("lenis")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      const ctx = gsap.context(() => {
        // Hero intro: words of the headline rise in, then the supporting copy and actions.
        gsap.from("[data-hero] [data-word]", { yPercent: 110, opacity: 0, rotateX: -40, duration: 1, ease: "expo.out", stagger: 0.045, delay: 0.1 });
        gsap.from("[data-hero] [data-hero-fade]", { y: 24, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.1, delay: 0.45 });

        // Section headings: word by word as they arrive.
        for (const heading of gsap.utils.toArray<HTMLElement>("[data-words]")) {
          gsap.from(heading.querySelectorAll("[data-word]"), {
            yPercent: 110,
            opacity: 0,
            duration: 0.9,
            ease: "expo.out",
            stagger: 0.04,
            scrollTrigger: { trigger: heading, start: "top 85%", once: true },
          });
        }

        // Cards and blocks lift in with a slight 3D tilt, staggered within their group.
        for (const group of gsap.utils.toArray<HTMLElement>("[data-rise-group]")) {
          gsap.from(group.querySelectorAll("[data-rise]"), {
            y: 70,
            rotateX: 14,
            opacity: 0,
            transformPerspective: 900,
            transformOrigin: "50% 100%",
            duration: 1.1,
            ease: "expo.out",
            stagger: 0.08,
            scrollTrigger: { trigger: group, start: "top 82%", once: true },
          });
        }

        // Milestone markers: the gate label slides in as its section arrives.
        for (const gate of gsap.utils.toArray<HTMLElement>("[data-gate]")) {
          gsap.from(gate, { x: -30, opacity: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: gate, start: "top 88%", once: true } });
        }
      });

      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh);
      void document.fonts?.ready.then(refresh);

      cleanup = () => {
        window.removeEventListener("load", refresh);
        ctx.revert();
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return null;
}

/** A heading whose words can be revealed one by one. The text stays whole for screen readers. */
export function Words({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <span data-word className="inline-block will-change-transform">
              {w}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}
