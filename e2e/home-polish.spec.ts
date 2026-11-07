import { expect, test } from "@playwright/test";

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

test("roadmap, topic and project cards carry a line graphic, not just a small icon (BR-4)", async ({ page }) => {
  const scene = 'svg[viewBox="0 0 300 110"]';
  await page.goto("/paths");
  await expect(page.locator(scene)).toHaveCount(9);
  await page.goto("/topics");
  expect(await page.locator(scene).count()).toBeGreaterThanOrEqual(20);
  await page.goto("/projects");
  expect(await page.locator(scene).count()).toBeGreaterThanOrEqual(20);
});
