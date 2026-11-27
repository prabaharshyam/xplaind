import { expect, test } from "@playwright/test";

// QA-6: a broad guard. The 16 Nov check of every section found the mock interview page 4 px wider than a
// 360 px phone (its Role list was wider than the screen). Each page here must fit the phone exactly.

test.use({ viewport: { width: 360, height: 740 } });

const PAGES = [
  "/", "/paths", "/roadmap/ai-engineer", "/start", "/stop/what-is-ai", "/stop/what-is-ai/ta", "/stop/what-is-ai/hinglish",
  "/library", "/library?view=topics", "/videos", "/projects", "/glossary", "/papers", "/books", "/resources",
  "/practice", "/interview", "/interview/simulator", "/interview/prep", "/interview/patterns", "/interview/design",
  "/jobs", "/plan", "/playground", "/ai", "/ai/tutor", "/ai/book", "/ai/resume",
  "/pricing", "/refunds", "/privacy", "/terms", "/contact", "/about", "/colleges", "/stories", "/blog", "/signin",
];

for (const path of PAGES) {
  test(`fits a 360 px phone without sideways scrolling: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 30_000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} is ${overflow}px wider than the screen`).toBeLessThanOrEqual(0);
  });
}

// NV-9 (2026-11-18, site review: the top bar was cut off between 768 and 1100 px): at every common
// tablet and laptop width the bar fits, nothing scrolls sideways, and the menu is reachable.
for (const width of [768, 820, 1024, 1119, 1120, 1280]) {
  test(`the top bar fits at ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/pricing");
    const bar = page.locator(".site-header .xp-glass");
    const fits = await bar.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const kids = [...el.querySelectorAll(":scope > * , :scope > * > *")].filter((k) => (k as HTMLElement).offsetParent !== null);
      return r.right <= window.innerWidth && kids.every((k) => k.getBoundingClientRect().right <= window.innerWidth + 0.5);
    });
    expect(fits).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    if (width < 1120) await expect(page.locator("details.site-menu > summary")).toBeVisible();
    else await expect(page.locator('header nav[aria-label="Main"] summary', { hasText: "AI Studio" })).toBeVisible();
  });
}
