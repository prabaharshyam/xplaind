import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 360, height: 740 } });

test("the footer is short: main links, the policies and who runs the site (FT-1)", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await footer.scrollIntoViewIfNeeded();
  expect(await footer.getByRole("link").count()).toBeLessThanOrEqual(14);
  for (const [name, href] of [["Privacy", "/privacy"], ["Terms", "/terms"], ["Refunds and cancellations", "/refunds"], ["Contact", "/contact"], ["All pages", "/explore"]] as const) {
    await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  }
  await expect(footer.getByText("Xplaind is a brand of ZEREH Ventures")).toBeVisible();
  await expect(footer.getByText("33GDZPS4274J1ZK")).toHaveCount(0); // on the Contact page instead
  const height = (await footer.boundingBox())!.height;
  expect(height).toBeLessThan(480); // it was well over 1,000 px tall on a phone
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("All pages lists everything the footer used to, and is accessible (FT-1)", async ({ page }) => {
  await page.goto("/explore");
  const main = page.getByRole("main");
  for (const name of ["Roadmaps", "Library", "Glossary", "Mock interview", "Courses", "Books", "Research papers", "Affiliate disclosure", "Jobs and salaries", "Meet the founder", "For colleges", "Learner stories", "Pricing", "Contact", "Refunds and cancellations"]) {
    await expect(main.getByRole("link", { name, exact: true }), name).toBeVisible();
  }
  await expect(main.getByRole("link", { name: /Join the community/ })).toHaveAttribute("href", /^https:\/\/chat\.whatsapp\.com\//);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(axe.violations).toEqual([]);
});

test("the reading-progress line sits below the menu pill, not behind it (LS-3)", async ({ page }) => {
  await page.goto("/stop/terminal-and-git");
  await page.waitForSelector(".lx-progress", { state: "attached" });
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(300);
  const { pill, bar } = await page.evaluate(() => ({
    pill: document.querySelector(".site-header > div")!.getBoundingClientRect().bottom,
    bar: document.querySelector(".lx-progress")!.getBoundingClientRect().top,
  }));
  expect(bar).toBeGreaterThanOrEqual(pill);
});
