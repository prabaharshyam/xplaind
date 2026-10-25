import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loadContent } from "../src/lib/content/load";

const noHorizontalScroll = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test("a stop page renders its lesson from MDX at 360px", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/stop/what-is-ai");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("What AI, machine learning");
  await expect(page.getByRole("heading", { name: "Learn it" })).toBeVisible();
  await expect(page.getByText("Start here")).toBeVisible();
  // from the MDX body: a bold lead-in and a list
  await expect(page.getByText("What to look for")).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "A language model is trained" })).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(false);
  expect(errors).toEqual([]);
});

test("a project check shows its brief", async ({ page }) => {
  await page.goto("/stop/use-an-assistant");
  await expect(page.getByText("Write three different prompts")).toBeVisible();
});

test("an unknown stop shows the not-found page and asks search engines to skip it", async ({ page }) => {
  // With Cache Components, the first hit on an unlisted id streams a 200 shell and
  // then renders notFound() (the page carries noindex); later hits return 404.
  // So assert what the visitor and crawlers see, not the first status code.
  await page.goto("/stop/does-not-exist");
  await expect(page.getByText("This page could not be found")).toBeVisible();
  await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
});

test("every stop page fits a 360px phone and passes the accessibility scan", async ({ page }) => {
  test.setTimeout(180_000);
  const { bundle } = loadContent(path.resolve(__dirname, "../content"));
  for (const { data: stop } of bundle.stops) {
    await page.goto(`/stop/${stop.id}`);
    await expect(page.getByRole("heading", { level: 1 }), stop.id).toHaveText(stop.title);
    expect(await noHorizontalScroll(page), stop.id).toBe(false);
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(violations, stop.id).toEqual([]);
  }
});
