"use client";
// A11Y-1: the first stop for a keyboard or screen-reader user. It jumps past the menu to the page's main content.
// Pages draw their own <main>, so this finds it and moves focus there instead of using a fixed id.
export function SkipLink() {
  return (
    <a
      href="#page"
      onClick={(e) => {
        const main = document.querySelector<HTMLElement>("main") ?? document.getElementById("page");
        if (!main) return;
        e.preventDefault();
        if (!main.hasAttribute("tabindex")) main.tabIndex = -1;
        main.focus(); // focusing scrolls it into view; no scrollIntoView call (NV-4)
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[1000] focus:rounded-2xl focus:bg-brand-700 focus:px-4 focus:py-3 focus:font-semibold focus:text-white focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}
