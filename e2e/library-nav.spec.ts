import AxeBuilder from "@axe-core/playwright";
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

test("IP-6: the Interview page is one app screen with tabs for questions, patterns and system design", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/interview");
  await expect(page.getByRole("heading", { level: 1, name: "AI interview questions" })).toBeVisible();
  const tabs = page.getByRole("navigation", { name: "Interview questions and guides" });
  await expect(tabs.getByRole("link")).toHaveText(["Questions", "Patterns", "System design"]);
  await expect(tabs.getByRole("link", { name: "Questions" })).toHaveAttribute("aria-current", "page");
  // The list is on the left and the first answer is already open on the right.
  const list = await page.getByRole("list", { name: "Questions" }).boundingBox();
  const answer = await page.getByRole("article").boundingBox();
  expect(answer!.x).toBeGreaterThan(list!.x + 300);
  await expect(page.getByRole("heading", { level: 3, name: "Short answer" })).toBeVisible();
  // IP-7: 20 questions at a time, and "Show more" adds the next 20.
  const rows = page.getByRole("list", { name: "Questions" }).getByRole("button");
  await expect(rows).toHaveCount(20);
  await page.getByRole("button", { name: /^Show more \(\d+ left\)$/ }).click();
  await expect(rows).toHaveCount(40);
  // Choosing another question shows its answer without leaving the page.
  const third = page.getByRole("list", { name: "Questions" }).getByRole("button").nth(2);
  const text = (await third.locator("span").first().textContent())!;
  await third.click();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(text);
  await expect(page).toHaveURL(/\/interview$/);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations).toEqual([]);

  // On a phone the list fills the screen; a question opens over it, with a way back.
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/interview?role=ai-product-manager");
  await expect(page.getByLabel("Role")).toHaveValue("ai-product-manager");
  await expect(page.getByRole("article")).toBeHidden();
  // IP-7: a phone is not handed the whole bank in one column.
  await page.goto("/interview");
  await expect(page.getByRole("list", { name: "Questions" }).getByRole("button")).toHaveCount(20);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThan(740 * 8);
  await page.getByRole("list", { name: "Questions" }).getByRole("button").first().click();
  await expect(page.getByRole("article")).toBeVisible();
  await expect(page.getByRole("list", { name: "Questions" })).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.getByRole("button", { name: "← All questions" }).click();
  await expect(page.getByRole("list", { name: "Questions" })).toBeVisible();

  // The current list becomes flashcards.
  await page.getByRole("button", { name: "Practise these as cards" }).click();
  await expect(page.getByText(/^Card 1 of \d+$/)).toBeVisible();
  await page.getByRole("button", { name: "← Back to the list" }).click();
  await expect(page.getByRole("list", { name: "Questions" })).toBeVisible();

  // The old address for answers by role lands here.
  await page.goto("/interview/answers");
  await expect(page).toHaveURL(/\/interview$/);
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
