import { expect, test } from "@playwright/test";

// LY-1, LY-2, IP-4, NV-8: the Library order, Library and Topics as one page, the Interview and Practice
// pages, and the pricing link in the menu.

const titles = (page: import("@playwright/test").Page) => page.locator("main ul.grid > li > a").allInnerTexts();

test("LY-1: the Library starts at What automation is and ends the Beginner 1 list with the good-to-know lessons", async ({ page }) => {
  await page.goto("/library?kind=lesson");
  await expect(page.locator("main").getByRole("status")).toContainText("results");
  const first = await titles(page);
  expect(first[0]).toBe("What automation is");

  await page.goto("/library?kind=lesson&level=B1");
  await expect(page.locator("main").getByRole("status")).toContainText("results");
  const b1 = await titles(page);
  expect(b1.slice(0, 2)).toEqual(["What automation is", "Mapping a process"]);
  // The awareness lessons come after the technical ones.
  for (const t of ["AI rules in India and abroad", "Bias and fairness", "Your company's AI policy"]) {
    expect(b1.indexOf(t)).toBeGreaterThan(1);
  }
});

test("LY-2: Library and Topics are one page, and /topics lands on its By topic view", async ({ page }) => {
  await page.goto("/topics");
  await expect(page).toHaveURL(/\/library\?view=topics$/);
  await expect(page.getByRole("button", { name: "By topic" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("link", { name: /^Agents/ }).first()).toBeVisible();

  await page.getByRole("button", { name: "All lessons, videos and skills" }).click();
  await expect(page.getByRole("searchbox", { name: "Search" })).toBeVisible();
  await expect(page.getByRole("button", { name: "All lessons, videos and skills" })).toHaveAttribute("aria-pressed", "true");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test("IP-4: on the Interview page patterns and system design come last, and practice cards are not there", async ({ page }) => {
  await page.goto("/interview");
  const hub = page.locator("main ul").first().getByRole("link");
  const names = (await hub.allInnerTexts()).map((t) => t.split("\n")[0]);
  expect(names.slice(-2)).toEqual(["Interview patterns", "System design answers"]);
  await expect(page.locator("main").getByRole("link", { name: /Practice cards/ })).toHaveCount(0);
});

test("the Practice page has no AI glossary block", async ({ page }) => {
  await page.goto("/practice");
  await expect(page.getByRole("heading", { level: 1, name: "Practice" })).toBeVisible();
  await expect(page.locator("main").getByText("AI glossary")).toHaveCount(0);
});

test("NV-8: the menu calls the pricing page Pricing, with no always-on dot", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/about");
  const bar = page.getByRole("banner");
  const link = bar.getByRole("link", { name: "Pricing", exact: true });
  await expect(link).toHaveAttribute("href", "/pricing");
  await expect(bar.getByRole("link", { name: "Pro", exact: true })).toHaveCount(0);
  await expect(link.locator("span[aria-hidden='true']")).toHaveCount(0); // not the current page, so no dot at all
});
