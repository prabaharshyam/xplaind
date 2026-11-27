import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcag = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test.use({ viewport: { width: 360, height: 740 } });

test("the AI tools page puts Study from my notes & books first and lists the new tools and guides (SU-1)", async ({ page }) => {
  await page.goto("/ai");
  const cards = page.getByRole("region", { name: "Study" }).getByRole("link"); // UX-14: the banner's launcher miniature is a list too
  await expect(cards.first()).toContainText("Study from my notes & books");
  await expect(page.getByRole("link", { name: /Interview questions and answers/ })).toHaveAttribute("href", "/interview");
  await expect(page.getByRole("main").getByRole("link", { name: /Research papers and free books/ })).toHaveCount(0); // moved to the Learn menu (NV-1)
  await expect(page.getByRole("heading", { name: "Complete guides to the AI tools people use at work" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Vibe coding with Claude Code/ })).toBeVisible();
  expect(await overflow(page)).toBe(false);
});

test("the papers library lists landmark papers and free books with their hosts (LB-1)", async ({ page }) => {
  await page.goto("/papers");
  await expect(page.getByRole("heading", { level: 3, name: "Attention Is All You Need" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Free books" })).toBeVisible();
  const download = page.getByRole("link", { name: /Download PDF.*Attention Is All You Need/ });
  await expect(download).toHaveAttribute("href", "https://arxiv.org/pdf/1706.03762");
  await expect(page.getByText("Hosted by arXiv, posted by the authors").first()).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("the AI tools topic has its lessons, and the removed Rust track sends old links on (FOCUS-2)", async ({ page }) => {
  await page.goto("/topics/ai-tools");
  await expect(page.getByRole("link", { name: /Build AI voice agents with Vapi/ })).toBeVisible();
  await page.goto("/topics/rust");
  await expect(page).toHaveURL(/\/library\?view=topics$/);
  await page.goto("/stop/rust-ownership-borrowing");
  await expect(page).toHaveURL(/\/library\?view=topics$/);
  await page.goto("/blog/rust-programming-language-2026");
  await expect(page).toHaveURL(/\/blog$/);
});
