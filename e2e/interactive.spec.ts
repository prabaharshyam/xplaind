import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcag = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test.use({ viewport: { width: 360, height: 740 } });

test("a roadmap topic opens a drawer where it can be marked done, without leaving the map", async ({ page }) => {
  await page.goto("/roadmap/forward-deployed-engineer");
  await page.getByRole("link", { name: /^Build a RAG app/ }).first().click();
  const drawer = page.getByRole("dialog", { name: "Build a RAG app" });
  await expect(drawer).toBeVisible();
  await expect(page).toHaveURL(/\/roadmap\/forward-deployed-engineer$/);
  await expect(drawer.getByText("Best free course")).toBeVisible();
  expect((await wcag(page)).violations).toEqual([]);
  await drawer.getByRole("button", { name: "Done" }).click();
  await expect(drawer.getByRole("button", { name: "Done" })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(page.getByRole("link", { name: /^Build a RAG app.*Done/ }).first()).toBeVisible();
  // the header now shows XP
  await expect(page.getByRole("banner").getByRole("link", { name: /\d+ XP/ })).toBeVisible();
});

test("the GenAI roadmap's topics open the drawer too", async ({ page }) => {
  await page.goto("/roadmap/genai-engineer");
  await page.getByRole("link", { name: /^AI, machine learning and language models/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("link", { name: /Read the lesson/ })).toHaveAttribute("href", "/stop/what-is-ai");
});

test("topic pages list lessons as cards", async ({ page }) => {
  await page.goto("/topics");
  await page.getByRole("link", { name: /^Agents/ }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Agents" })).toBeVisible();
  await expect(page.getByRole("link", { name: /The agent loop/ })).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("a lesson shows its parts, a reading guide and XP for the check", async ({ page }) => {
  await page.goto("/stop/what-is-ai");
  await expect(page.getByText("Part 1 of 5")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Check/ })).toContainText("+50 XP");
  await expect(page.getByRole("navigation", { name: /Lessons on the/ }).getByText("Next →")).toBeVisible();
  expect(await overflow(page)).toBe(false);
});

test("the progress page shows XP, streak and badges without an account", async ({ page }) => {
  await page.addInitScript(() => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    localStorage.setItem(
      "xplaind.progress.v1",
      JSON.stringify({ version: 1, freeOnly: false, stops: { "what-is-ai": { status: "done", how: "check", score: 100, updatedOn: today } } }),
    );
  });
  await page.goto("/dashboard");
  await expect(page.getByRole("region", { name: "XP and streak" }).getByText("70 XP", { exact: true })).toBeVisible();
  await expect(page.getByText("Earned: Finish your first lesson")).toBeVisible();
  await expect(page.getByText("Earned: Score 100% on a lesson check")).toBeVisible();
  expect((await wcag(page)).violations).toEqual([]);
});
