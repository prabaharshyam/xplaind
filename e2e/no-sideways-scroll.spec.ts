import { expect, test } from "@playwright/test";

// QA-6: a broad guard. The 16 Nov check of every section found the mock interview page 4 px wider than a
// 360 px phone (its Role list was wider than the screen). Each page here must fit the phone exactly.

test.use({ viewport: { width: 360, height: 740 } });

const PAGES = [
  "/", "/paths", "/roadmap/ai-engineer", "/start", "/stop/what-is-ai", "/stop/what-is-ai/ta", "/stop/what-is-ai/hinglish",
  "/library", "/library?view=topics", "/videos", "/projects", "/glossary", "/papers", "/books", "/resources",
  "/practice", "/interview", "/interview/simulator", "/interview/answers", "/interview/patterns", "/interview/design",
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
