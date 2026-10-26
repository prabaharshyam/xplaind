import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
const wcag = (page: Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

test("the glossary lists terms A to Z and links each to its lessons", async ({ page }) => {
  await page.goto("/glossary");
  await expect(page.getByRole("heading", { level: 1, name: "AI glossary" })).toBeVisible();
  const embedding = page.locator("#embedding");
  await expect(embedding.locator("dt")).toContainText("Embedding");
  await expect(embedding.getByRole("link", { name: "Embeddings" })).toHaveAttribute("href", "/stop/embeddings");
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("an explainer lesson shows its sections, key terms and the course after the text", async ({ page }) => {
  await page.goto("/stop/embeddings");
  const main = page.getByRole("main");
  for (const h of ["What it is", "How it works", "A worked example", "Common mistakes", "Practise", "Key terms"]) {
    await expect(main.getByRole("heading", { level: 2, name: h })).toBeVisible();
  }
  await main.locator("summary", { hasText: "Cosine similarity" }).click(); // key terms open in place
  await expect(main.getByRole("link", { name: "More in the glossary" }).first()).toHaveAttribute("href", "/glossary#cosine-similarity");
  await expect(main.getByRole("heading", { level: 2, name: "Go deeper: the best course" })).toBeVisible();
  expect(await overflow(page)).toBe(false); // the code sample scrolls inside its box
  expect((await wcag(page)).violations).toEqual([]);
});
