import { expect, test } from "@playwright/test";

const overflow = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test.use({ viewport: { width: 360, height: 740 } });

test("the AI tools page lists every tool and says when AI is off", async ({ page }) => {
  await page.goto("/ai");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  for (const name of ["AI tutor", "Resume review", "Code playground", "AI interview feedback"]) {
    await expect(page.getByRole("main").getByRole("link").filter({ has: page.getByText(name, { exact: true }) })).toBeVisible();
  }
  await expect(page.getByText(/AI-powered tools are paused right now/)).toBeVisible();
  // Each AI-powered tool says it is paused; the others say they need no AI.
  await expect(page.getByText("Paused", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("No AI needed", { exact: true }).first()).toBeVisible();
  expect(await overflow(page)).toBe(false);
});

test("the removed AI roadmap generator sends old links to the roadmaps (FOCUS-2)", async ({ page, request }) => {
  await page.goto("/ai/roadmap");
  await expect(page).toHaveURL(/\/paths$/);
  expect((await request.post("/api/ai/roadmap", { data: {} })).status()).toBe(404);
});

test("every lesson ends with the AI tutor section", async ({ page }) => {
  await page.goto("/stop/what-is-ai");
  const tutor = page.getByRole("region", { name: /Ask the AI tutor/ });
  await expect(tutor).toBeVisible();
  await expect(tutor.getByText("AI features are not switched on yet")).toBeVisible();
});

test("the AI tutor page works without AI, and the old coach link lands on it", async ({ page }) => {
  await page.goto("/ai/coach");
  await expect(page).toHaveURL(/\/ai\/tutor$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("AI features are not switched on yet")).toBeVisible();
  await expect(page.getByText("What your tutor sees")).toBeVisible();
  expect(await overflow(page)).toBe(false);
});
