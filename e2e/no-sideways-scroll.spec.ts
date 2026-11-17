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

// NV-9: the top bar once ran 128 px past a 768 px tablet (five menu groups plus search and account did
// not fit), and nothing caught it because the guard above only ran at phone width. The site chrome is
// shared, so one page per kind is enough here.
for (const width of [768, 900, 1024]) {
  test.describe(`at ${width} px`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const path of ["/", "/library", "/roadmap/ai-engineer", "/stop/what-is-ai", "/interview", "/pricing"]) {
      test(`fits without sideways scrolling: ${path}`, async ({ page }) => {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 30_000 });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${path} is ${overflow}px wider than a ${width} px screen`).toBeLessThanOrEqual(0);
      });
    }
  });
}

test("the phone menu rows carry no index numbers (NV-9)", async ({ page }) => {
  await page.goto("/library");
  await page.getByRole("banner").locator(".site-menu > summary").click();
  const rows = page.locator(".site-menu [data-nav-row] > button");
  await expect(rows.first()).toBeVisible();
  for (const text of await rows.allTextContents()) expect(text.trim()).not.toMatch(/^\d/);
});
