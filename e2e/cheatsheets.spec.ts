import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcag = (page: import("@playwright/test").Page) => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test("cheatsheets are listed from Practice and each one quizzes, filters and downloads (CS-1, CS-2)", async ({ page }) => {
  // Sections fade in as they scroll into view; scan the finished page, as reduced-motion users see it.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/practice");
  await page.getByRole("link", { name: "Cheatsheets" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Cheatsheets" })).toBeVisible();
  await page.getByRole("link", { name: /^RAG/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "RAG" })).toBeVisible();
  await expect(page.getByText("Extract text from files")).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);

  await page.getByRole("button", { name: "Quiz me" }).click();
  await expect(page.getByText("Extract text from files")).toHaveCount(0);
  await page.getByRole("button", { name: /^Ingest/ }).click();
  await expect(page.getByText("Extract text from files")).toBeVisible();
  await expect(page.getByText("1 of 22 revealed")).toBeVisible();

  await page.getByRole("button", { name: /Quiz on/ }).click();
  await page.getByLabel("Filter this cheatsheet").fill("BM25");
  await expect(page.getByRole("heading", { name: "Search" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chunking" })).toHaveCount(0);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF" }).click();
  expect((await download).suggestedFilename()).toBe("xplaind-rag-cheatsheet.pdf");
});

test("the home page shows what early users said (SO-1)", async ({ page }) => {
  await page.goto("/");
  const section = page.getByRole("region", { name: "What early learners say" });
  await expect(section.getByText("Rajakumar")).toBeVisible();
  await expect(section.getByText("Program Manager at MNC")).toBeVisible();
  await expect(section.locator("figure")).toHaveCount(5);
});
