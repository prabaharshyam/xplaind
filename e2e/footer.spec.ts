import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 360, height: 740 } });

test("the footer has every menu option and the business details, and folds into rows on a phone (FT-2)", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await footer.scrollIntoViewIfNeeded();
  for (const [name, href] of [["Privacy", "/privacy"], ["Terms", "/terms"], ["Refunds and cancellations", "/refunds"]] as const) {
    await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  }
  await expect(footer.getByText(/Xplaind is a brand of ZEREH Ventures · hello@/)).toBeVisible();
  await expect(footer.getByText("33GDZPS4274J1ZK")).toHaveCount(0); // owner: no GST number in the footer; it is on Contact
  // Phones: each column is a closed row, so the footer stays short.
  expect((await footer.boundingBox())!.height).toBeLessThan(1100);
  const company = footer.locator("summary", { hasText: "Company" });
  await company.click();
  await expect(footer.getByRole("link", { name: "All pages", exact: true })).toHaveAttribute("href", "/explore");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  const axe = await new AxeBuilder({ page }).include("footer").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(axe.violations).toEqual([]);
});

test("on a laptop the footer shows every menu item in open columns (FT-2)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/glossary");
  const footer = page.getByRole("contentinfo");
  for (const name of ["Learn", "Interview", "Career", "AI Studio", "Resources", "Company"]) {
    await expect(footer.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  for (const name of ["Roadmaps", "Stay on track", "Mock interview", "Prep plan", "Questions", "Jobs and salaries", "Resume review", "Study from my notes & books", "AI tutor", "Code playground", "Pricing", "Courses", "Affiliate disclosure", "Meet the founder", "Contact"]) {
    await expect(footer.getByRole("link", { name, exact: true }), name).toBeVisible();
  }
  await expect(footer.getByRole("link", { name: /Join the community/ })).toHaveAttribute("href", /chat\.whatsapp\.com|\/community/);
  const axe = await new AxeBuilder({ page }).include("footer").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(axe.violations).toEqual([]);
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
