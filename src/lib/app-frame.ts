// APP-1 (2026-11-27, owner: "once signed in it should have an app interface"; plan in docs/plans/app-experience.md).
// Same URLs, two frames: visitors always see the website; a signed-in learner sees product pages inside the app frame
// (side rail, slim top bar, no marketing footer). The frame is presentation only: it never decides who can see what.
// Pure, no React, so the pre-paint script and the tests share one list.

/** Product pages: the app frame when signed in. */
export const APP_PREFIXES = [
  "/dashboard",
  "/paths",
  "/roadmap",
  "/stop",
  "/library",
  "/topics",
  "/videos",
  "/glossary",
  "/papers",
  "/books",
  "/resources",
  "/certifications",
  "/projects",
  "/practice",
  "/interview",
  "/ai",
  "/plan",
  "/playground",
  "/jobs",
  "/settings",
  "/start",
  "/result",
] as const;

/** Pages under a product prefix that stay website pages (search landing pages). */
export const WEBSITE_PREFIXES = ["/interview/for"] as const;

const under = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

export type Frame = "app" | "website";

/** Which frame a page gets. Marketing pages, and every page for visitors, keep the website frame. */
export function frameFor(path: string, signedIn: boolean): Frame {
  if (!signedIn) return "website";
  if (WEBSITE_PREFIXES.some((p) => under(path, p))) return "website";
  return APP_PREFIXES.some((p) => under(path, p)) ? "app" : "website";
}

/** On this device the learner was signed in last time: lets the first paint already show the app frame. */
export const APP_HINT = "xplaind.app.v1";

/** Runs in <head> before paint, like the theme script. Presentation only; AppFrameSync corrects it once the account is known. */
export const APP_SCRIPT = `(function(){try{if(localStorage.getItem(${JSON.stringify(APP_HINT)})!=="1")return;var p=location.pathname,u=function(h){return p===h||p.indexOf(h+"/")===0};if(${JSON.stringify(WEBSITE_PREFIXES)}.some(u))return;if(${JSON.stringify(APP_PREFIXES)}.some(u))document.documentElement.dataset.frame="app"}catch(e){}})()`;
