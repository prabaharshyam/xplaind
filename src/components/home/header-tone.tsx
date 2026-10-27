"use client";

import { useEffect } from "react";

/**
 * The home page can stay mounted but hidden after a client-side navigation, so the
 * CSS `:has(.home-hero)` would keep the top bar dark on other pages. Effects stop
 * when the page is hidden, so mark the header light then, and clear it on return.
 */
export function HomeHeaderTone() {
  useEffect(() => {
    const html = document.documentElement;
    delete html.dataset.header;
    return () => {
      html.dataset.header = "light";
    };
  }, []);
  return null;
}
