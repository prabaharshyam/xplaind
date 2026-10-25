import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcag = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

test.use({ viewport: { width: 360, height: 740 } });

test("the blog lists posts and a post renders with its FAQ and structured data", async ({ page }) => {
  await page.goto("/blog");
  await expect(page.getByRole("heading", { level: 1, name: "Blog" })).toBeVisible();
  await page.getByRole("link", { name: /How to learn AI in 2026/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: /How to learn AI in 2026/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Questions people ask" })).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible(); // GFM tables render as tables
  expect(await page.locator('script[type="application/ld+json"]').count()).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("the certifications page shows every fee with its check date (RM-6)", async ({ page }) => {
  await page.goto("/certifications");
  await expect(page.getByRole("heading", { level: 1, name: "AI certifications" })).toBeVisible();
  const fees = page.getByText(/^US\$\d+ plus tax \(checked on /);
  expect(await fees.count()).toBeGreaterThan(3);
  await expect(page.getByText(/^\$\d+$/)).toHaveCount(0);
  expect((await wcag(page)).violations).toEqual([]);
});

test("llms.txt and the sitemap list the new pages", async ({ request }) => {
  const txt = await (await request.get("/llms.txt")).text();
  expect(txt).toMatch(/^# Xplaind/);
  expect(txt).toContain("/interview/simulator");
  expect(txt).toContain("/blog/how-to-learn-ai");
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const p of ["/blog/how-to-learn-ai</loc>", "/certifications</loc>", "/interview/for/ml-engineer</loc>", "/interview/simulator</loc>"]) {
    expect(xml).toContain(p);
  }
});
