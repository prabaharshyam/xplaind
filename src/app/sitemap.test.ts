import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sitemap, { PAGES_UPDATED_ON } from "./sitemap";

// SE-2 and IQ-3: the sitemap lists every public page once, with a real date.
const PRIVATE = ["/card/[id]", "/dashboard", "/result", "/settings", "/signin"];

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
      .filter((r) => !PRIVATE.includes(r))
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
});
