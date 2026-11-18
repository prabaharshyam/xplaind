import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sitemap, { PAGES_UPDATED_ON } from "./sitemap";
import { getContent, lessonAlternates } from "@/lib/content";

// SE-2 and IQ-3: the sitemap lists every public page once, with a real date.
const PRIVATE = ["/card/[id]", "/certificate/[id]", "/u/[handle]", "/commit/stopped", "/dashboard", "/pricing/return", "/result", "/settings", "/settings/billing", "/settings/billing/receipt/[order]", "/signin"];
// Pages that only redirect elsewhere (a sitemap lists the page they land on, not the redirect). /topics became the Library's By topic view (LY-2).
const REDIRECTS = ["/topics"];

function routes(dir: string, prefix = ""): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (!statSync(p).isDirectory()) return name === "page.tsx" ? [prefix || "/"] : [];
    return name.startsWith("(") || name.startsWith("_") || name === "api" ? [] : routes(p, `${prefix}/${name}`);
  });
}

describe("sitemap", () => {
  const urls = sitemap().map((e) => new URL(e.url).pathname);

  it("lists every public page route", () => {
    const missing = routes(join(process.cwd(), "src/app"))
      .filter((r) => !PRIVATE.includes(r) && !REDIRECTS.includes(r))
      .filter((r) => {
        const fixed = r.split("/[")[0] || "/";
        return r.includes("[") ? !urls.some((u) => u.startsWith(`${fixed}/`) && u !== fixed) : !urls.includes(r);
      });
    expect(missing).toEqual([]);
  });

  it("lists each page once and never a private one", () => {
    expect(new Set(urls).size).toBe(urls.length);
    for (const p of ["/dashboard", "/result", "/settings", "/signin"]) expect(urls).not.toContain(p);
  });

  it("dates every page, none later than the newest page change", () => {
    const newest = new Date(`${PAGES_UPDATED_ON}T23:59:59+05:30`).getTime();
    for (const e of sitemap()) expect(new Date(e.lastModified!).getTime(), e.url).toBeLessThanOrEqual(Math.max(newest, Date.now()));
  });

  it("lists the translated lessons, and links them with valid language codes (SE-9)", () => {
    const t = getContent().translations[0]?.data;
    if (!t) return;
    expect(urls).toContain(`/stop/${t.id}/${t.lang}`);
    const alt = lessonAlternates(t.id);
    expect(alt["x-default"]).toBe(`/stop/${t.id}`);
    expect(Object.keys(alt)).not.toContain("tanglish");
    expect(Object.keys(alt)).not.toContain("hinglish");
    for (const code of Object.keys(alt)) expect(code).toMatch(/^(x-default|[a-z]{2}(-Latn)?)$/);
  });
});
