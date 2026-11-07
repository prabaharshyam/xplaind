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
  await expect(section.getByText("Rajakumar", { exact: true })).toBeVisible();
  await expect(section.getByText("Program Manager at MNC")).toBeVisible();
  await expect(section.locator("figure")).toHaveCount(5);
});

test("the testimonials are a sideways row with short excerpts and a way to read more (SO-1, BR-4)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const row = page.getByRole("list", { name: "Testimonials, scroll sideways" });
  await row.scrollIntoViewIfNeeded();
  // the short version first, the whole quote on request
  await expect(page.getByText("It gives me the clarity and direction I need")).toHaveCount(0);
  await page.getByRole("button", { name: "Read more from Rajakumar" }).click();
  await expect(page.getByText("It gives me the clarity and direction I need to build my skills and grow my career.")).toBeVisible();
  await page.getByRole("button", { name: "Show less from Rajakumar" }).click();
  await expect(page.getByText("It gives me the clarity and direction I need")).toHaveCount(0);
  // the arrow moves the row sideways
  const before = await row.evaluate((el) => el.scrollLeft);
  await page.getByRole("button", { name: "Next testimonials" }).click();
  await expect.poll(() => row.evaluate((el) => el.scrollLeft)).toBeGreaterThan(before);
});

test("the Stay on track card shows an example week, so it is not empty (BR-4)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Your week · 5 hours")).toBeVisible();
  await expect(page.getByText("7 day streak")).toBeVisible();
});

test("a cheatsheet sequence is a numbered timeline and the sheet has a map of its sections (BR-4)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/cheatsheets/rag");
  await expect(page.getByText("6 steps")).toBeVisible();
  await expect(page.getByText("4 items").first()).toBeVisible();
  const map = page.getByRole("navigation", { name: "Sections of this cheatsheet" });
  await expect(map.getByRole("link")).toHaveCount(5);
  await map.getByRole("link", { name: /Grounding/ }).click();
  await expect(page.getByRole("heading", { name: /Grounding/ })).toBeInViewport();
});

test("roadmap, topic and project cards carry a line graphic, not just a small icon (BR-4)", async ({ page }) => {
  const scene = 'svg[viewBox="0 0 300 110"]';
  await page.goto("/paths");
  await expect(page.locator(scene)).toHaveCount(9);
  await page.goto("/topics");
  expect(await page.locator(scene).count()).toBeGreaterThanOrEqual(20);
  await page.goto("/projects");
  expect(await page.locator(scene).count()).toBeGreaterThanOrEqual(20);
});
