import { expect, test } from "@playwright/test";

test("'On this page' ticks every section the learner has scrolled past, not just the one on screen (LS-1)", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/stop/terminal-and-git");
  const nav = page.getByRole("navigation", { name: "On this page" });
  await expect(nav).toContainText(" of 12 sections read");
  // Jump straight down the page, as a fast scroll or a link would.
  await nav.getByRole("link", { name: "Practice", exact: true }).click();
  await expect.poll(async () => Number((await nav.innerText()).match(/(\d+) of \d+ sections read/)?.[1])).toBeGreaterThan(4);
  const reads = await nav.getByText("(read)").count();
  expect(reads).toBeGreaterThan(4);
});

// Hover styles only apply on a device that can hover, so this one runs as a desktop mouse, not the touch phone.
test.describe("desktop mouse", () => {
  test.use({ hasTouch: false, isMobile: false });
test("in dark mode a tag keeps readable text when hovered (LS-2)", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/stop/terminal-and-git");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  const chip = page.locator("p[aria-label='Tags'] a").nth(1);
  await chip.scrollIntoViewIfNeeded();
  await chip.hover();
  const lum = (c: string) => {
    const [r, g, b] = (c.match(/[\d.]+/g) ?? ["0", "0", "0"]).slice(0, 3).map((v) => {
      const x = Number(v) / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  await page.waitForTimeout(400); // let the hover colour finish changing
  const { bg, fg } = await chip.evaluate((e) => ({ bg: getComputedStyle(e).backgroundColor, fg: getComputedStyle(e).color }));
  const ratio = (Math.max(lum(bg), lum(fg)) + 0.05) / (Math.min(lum(bg), lum(fg)) + 0.05);
  expect(ratio, `${fg} on ${bg}`).toBeGreaterThan(4.5);
});
});
