import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const wcag = (page: Page) => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test("the pricing page shows the free plan, the three passes and the daily AI allowance (PAY-5)", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { level: 1, name: "Learn for free. Get more AI help with Pro." })).toBeVisible();
  for (const price of ["₹0", "₹249", "₹1,199", "₹1,999"]) await expect(page.getByText(price, { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Most popular")).toBeVisible();
  const table = page.getByRole("table", { name: "AI turns per day, by account" });
  await expect(table.getByRole("row", { name: /AI tutor questions 5 10 50/ })).toBeVisible();
  // Pro is closed in this build (no PAYMENTS_MODE): no buy buttons, a clear notice, and no Pricing link in the menu.
  await expect(page.getByText("Pro passes are not on sale yet.")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Buy for/ })).toHaveCount(0);
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("the refund policy and terms describe passes (PAY-6)", async ({ page }) => {
  await page.goto("/refunds");
  await expect(page.getByRole("heading", { level: 1, name: "Refunds and cancellations" })).toBeVisible();
  await expect(page.getByText(/within 7 days of buying/).first()).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Pro passes" })).toBeVisible();
  await page.goto("/privacy");
  await expect(page.getByText("Cashfree Payments")).toBeVisible();
});

test("lessons, roadmaps and the playground stay open without signing in (PAY-1)", async ({ page }) => {
  for (const [path, heading] of [
    ["/stop/what-is-ai", /What AI, machine learning/],
    ["/roadmap/genai-engineer", /./],
    ["/playground", /./],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByText("Today's free AI turns are used")).toBeHidden();
  }
});
