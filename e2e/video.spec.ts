import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcag = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test.use({ viewport: { width: 360, height: 740 } });

test("a lesson shows its video lessons near the top and plays YouTube on the page (RM-4)", async ({ page }) => {
  const youtube: string[] = [];
  page.on("request", (r) => /youtube/.test(r.url()) && youtube.push(r.url()));
  await page.goto("/stop/neural-networks");
  const panel = page.getByRole("region", { name: "Watch & learn" }).first();
  await expect(panel).toBeVisible();
  await expect(panel.getByText("Video lesson", { exact: true }).first()).toBeVisible();
  expect(youtube).toEqual([]); // nothing loads from YouTube until the learner presses play

  await panel.getByRole("button", { name: /^Watch here/ }).first().click();
  const player = page.getByRole("dialog", { name: /^Video lesson:/ });
  await expect(player).toBeVisible();
  await expect(player.locator("iframe")).toHaveAttribute("src", /^https:\/\/www\.youtube-nocookie\.com\/embed\//);
  await page.keyboard.press("Escape");
  await expect(player).toBeHidden();
  await expect(player.locator("iframe")).toHaveCount(0); // closing removes the player, so the video stops
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("a course whose site is for adults shows a clear notice right under its link", async ({ page }) => {
  await page.goto("/stop/deepfakes-misinformation");
  await expect(page.getByRole("note").filter({ hasText: "18 or older" }).first()).toBeVisible();
});

test("Google's learning paths are called video lessons, not certifications", async ({ page }) => {
  await page.goto("/resources");
  await page.getByRole("searchbox").fill("Introduction to Generative AI").catch(() => undefined);
  await expect(page.getByText("Google's video lessons").first()).toBeVisible();
});
