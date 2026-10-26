import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcag = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test.use({ viewport: { width: 360, height: 740 } });

test("X Bot answers a doubt from Xplaind's own content, on any page (XB-1, XB-2)", async ({ page }) => {
  await page.goto("/topics");
  const launcher = page.getByRole("button", { name: "Ask X Bot for help" });
  await launcher.click();
  const bot = page.getByRole("dialog", { name: "X Bot" });
  await expect(bot).toBeVisible();
  await expect(bot.getByRole("textbox", { name: "Ask X Bot" })).toBeFocused();
  await bot.getByRole("textbox", { name: "Ask X Bot" }).fill("What is prompt injection?");
  await bot.getByRole("button", { name: "Send" }).click();
  await expect(bot.getByText("Here’s what Xplaind says:")).toBeVisible();
  await expect(bot.getByText("Prompt injection", { exact: true })).toBeVisible();
  await expect(bot.getByRole("link", { name: "Lesson: Defend against prompt injection" })).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);

  await bot.getByRole("button", { name: "How do I mark a topic done?" }).click();
  await expect(bot.getByText(/tap Mark on a topic card/)).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(bot).toBeHidden();
  await expect(launcher).toBeFocused();
});

test("X Bot knows the page you are on, and says so when it finds nothing", async ({ page }) => {
  await page.goto("/stop/prompt-injection");
  await page.getByRole("button", { name: "Ask X Bot for help" }).click();
  const bot = page.getByRole("dialog", { name: "X Bot" });
  await bot.getByRole("button", { name: "What is this page about?" }).click();
  await expect(bot.getByText("This page is about:")).toBeVisible();
  await bot.getByRole("textbox", { name: "Ask X Bot" }).fill("quantum chromodynamics lattice");
  await page.keyboard.press("Enter");
  await expect(bot.getByText(/couldn’t find that on Xplaind/)).toBeVisible();
});

test("X Bot stays out of the mock interview (XB-1)", async ({ page }) => {
  await page.goto("/interview/simulator");
  await expect(page.getByRole("heading", { level: 1, name: "Mock interview" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ask X Bot for help" })).toHaveCount(0);
});
