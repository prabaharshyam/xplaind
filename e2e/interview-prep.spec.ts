import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcag = (page: import("@playwright/test").Page) => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test("the interview hub leads to patterns, and a pattern explains itself with a diagram (IP-1, IP-3)", async ({ page }) => {
  await page.goto("/interview");
  await page.getByRole("link", { name: /^Interview patterns/ }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "AI interview patterns" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Retrieval and RAG" })).toBeVisible();
  await page.getByRole("link", { name: /^Hybrid search \+ rerank/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Hybrid search + rerank" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Say it in the interview" })).toBeVisible();
  await expect(page.locator("figure:has(svg)")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /hybrid search/i }).first()).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("a system design answer walks through the 35-minute shape (IP-2)", async ({ page }) => {
  await page.goto("/interview/design");
  await page.getByRole("link", { name: /customer support assistant for an Indian bank/ }).click();
  for (const h of ["Clarify", "Requirements and numbers", "High-level design", "Deep dives", "Failures", "Evals and monitoring", "Trade-offs"]) {
    await expect(page.getByRole("heading", { level: 2, name: new RegExp(h) })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "RAG pipeline" })).toHaveAttribute("href", "/interview/patterns/rag-pipeline");
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});
