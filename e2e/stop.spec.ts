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
  await expect(page.getByRole("heading", { name: "Go deeper: the best course" })).toBeVisible();
  await expect(page.locator("#courses").getByText("Start here")).toBeVisible();
  // from the MDX body: section headings, sub-headings, a list, a table and a text diagram
  await expect(page.getByRole("heading", { level: 2, name: "How it works" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Rules versus learning" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "is the broad goal" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Rule-based software" })).toBeVisible();
  await expect(page.locator("pre code.language-text").first()).toContainText("Machine learning (ML)");
  expect(await noHorizontalScroll(page)).toBe(false);
  expect(errors).toEqual([]);
});

test("a deep lesson has an exercise with answers, flashcards that remember, and path lessons", async ({ page }) => {
  await page.goto("/stop/what-is-ai");
  const tryIt = page.getByRole("region", { name: "Sort the AI in Asha's day" });
  await expect(tryIt.getByRole("listitem").filter({ hasText: "Which is not AI at all?" })).toBeVisible();
  await tryIt.getByRole("button", { name: "Check your answers" }).click();
  await expect(tryIt.getByRole("region", { name: "Answers" })).toContainText("spreadsheet formula");

  const cards = page.getByRole("region", { name: /Test your understanding/ });
  await expect(cards.getByText("0 of 8")).toBeVisible();
  await cards.getByRole("button", { name: "Reveal the answer" }).click();
  await expect(cards.getByText(/human judgement/)).toBeVisible();
  await cards.getByRole("button", { name: "Already knew that" }).click();
  await cards.getByRole("button", { name: "Didn't know that" }).click();
  await expect(cards.getByText("2 of 8")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("region", { name: /Test your understanding/ }).getByText("2 of 8")).toBeVisible();
  await page.getByRole("region", { name: /Test your understanding/ }).getByRole("button", { name: "Reset" }).click();
  await expect(page.getByRole("region", { name: /Test your understanding/ }).getByText("0 of 8")).toBeVisible();

  // on a phone, the path's lesson list sits at the end of the lesson
  await page.getByText(/^Lessons on /).last().click();
  await expect(page.getByRole("link", { name: "What AI, machine learning and a language model are" }).last()).toHaveAttribute("aria-current", "page");
});

test("a project check shows its brief", async ({ page }) => {
  await page.goto("/stop/use-an-assistant");
  await expect(page.getByText(/^Project: Pick a task from your own work/)).toBeVisible();
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
  test.setTimeout(420_000); // 163 pages, each scanned
  const { bundle } = loadContent(path.resolve(__dirname, "../content"));
  for (const { data: stop } of bundle.stops) {
    await page.goto(`/stop/${stop.id}`);
    await expect(page.getByRole("heading", { level: 1 }), stop.id).toHaveText(stop.title);
    expect(await noHorizontalScroll(page), stop.id).toBe(false);
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(violations, stop.id).toEqual([]);
  }
});

/** Test your understanding, Try it and Key terms respond to clicks on a lesson page. */
async function exerciseWidgets(page: import("@playwright/test").Page, id: string) {
  const cards = page.locator("#flashcards");
  await cards.getByRole("button", { name: "Reveal the answer" }).click();
  await expect(cards.getByRole("button", { name: "Reveal the answer" }), id).toHaveCount(0);
  await cards.getByRole("button", { name: "Already knew that" }).click();
  await expect(cards.getByText(/^1 of \d+$/), id).toBeVisible();
  await cards.getByRole("button", { name: "Reset" }).click();

  const tryIt = page.locator("#try-it");
  await tryIt.getByRole("button", { name: "Check your answers" }).click();
  await expect(tryIt.getByRole("region", { name: "Answers" }), id).toBeVisible();

  const term = page.locator('section[aria-labelledby="terms-heading"] details').first();
  if (await term.count()) {
    await term.locator("summary").click();
    await expect(term, id).toHaveAttribute("open", "");
  }
}

test("on every lesson, the flashcards, Try it and key terms respond", async ({ page }) => {
  test.setTimeout(420_000);
  const { bundle } = loadContent(path.resolve(__dirname, "../content"));
  for (const { data: stop } of bundle.stops) {
    if (!stop.exercise || stop.flashcards.length === 0) continue;
    await page.goto(`/stop/${stop.id}`);
    await exerciseWidgets(page, stop.id);
  }
});

test("the lesson widgets still work when the browser blocks storage", async ({ page }) => {
  await page.addInitScript(() => {
    const blocked = () => {
      throw new DOMException("blocked", "SecurityError");
    };
    Object.defineProperty(window, "localStorage", { get: blocked });
  });
  await page.goto("/stop/kpi-that-matters");
  await exerciseWidgets(page, "kpi-that-matters");
});
