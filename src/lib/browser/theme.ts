// BR-6: light or dark. UX-24 (2026-11-27, owner: "when anyone lands on the site, let them land on light mode; if they
// want dark mode, let them change it with the switch"): light unless the header switch saved "dark" on this device.
// The choice lives on <html data-theme>, set before paint by THEME_SCRIPT, so nothing flashes.

export const THEME_KEY = "xp-theme";
export type Theme = "light" | "dark";

/** Runs in <head> before the page paints. Kept tiny and dependency-free. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");var d=t==="dark";document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}})()`;

export const currentTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

/** Like matchMedia("(prefers-color-scheme: dark)"), but follows the site's theme, switch included. */
export function darkScheme() {
  const listeners = new Set<() => void>();
  const observer = new MutationObserver(() => listeners.forEach((fn) => fn()));
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return {
    get matches() {
      return currentTheme() === "dark";
    },
    addEventListener: (_: "change", fn: () => void) => void listeners.add(fn),
    removeEventListener: (_: "change", fn: () => void) => {
      listeners.delete(fn);
      if (!listeners.size) observer.disconnect();
    },
  };
}
