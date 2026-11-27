import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 360, height: 740 } });

test("the focus timer runs across pages, logs a finished block and fits a phone (FC-1)", async ({ page }) => {
  await page.clock.install();
  await page.goto("/paths");
  const open = page.getByRole("button", { name: /^Focus timer/ });
  await open.click();
  const panel = page.getByRole("region", { name: "Focus timer" }).or(page.locator("#focus-timer"));
  await expect(panel).toBeVisible();
  await expect(panel.getByText("25:00")).toBeVisible();
  const axe = await new AxeBuilder({ page }).include("#focus-timer").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(axe.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  await panel.getByRole("button", { name: "Start focus" }).click();
  await expect(panel.getByRole("button", { name: "50 min focus, 10 min break" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await page.clock.fastForward("01:00");
  await expect(page.getByRole("button", { name: "Focus timer, focus running" })).toContainText(/2[34]:\d\d/);

  // A different page: the timer carries on from where it was.
  await page.goto("/glossary");
  await expect(page.getByRole("button", { name: "Focus timer, focus running" })).toContainText(/2[34]:\d\d/);
  await page.clock.fastForward("25:00");
  await expect(page.getByRole("status").filter({ hasText: "Focus block done" })).toBeAttached();
  await page.getByRole("button", { name: /^Focus timer/ }).click();
  await expect(panel.getByRole("heading", { name: "Break" })).toBeVisible();
  await expect(panel.getByText("5:00")).toBeVisible();
  await expect(panel.getByText(/Today: 1 block, 25 min/)).toBeVisible();

  // Skipping the break does not log anything more.
  await panel.getByRole("button", { name: "Skip" }).click();
  await expect(panel.getByRole("heading", { name: "Focus" })).toBeVisible();
  await expect(panel.getByText(/Today: 1 block, 25 min/)).toBeVisible();
});
