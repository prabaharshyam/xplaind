import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./signed-in";

const wcag = (page: import("@playwright/test").Page) => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: import("@playwright/test").Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test("signed in, product pages open in the app frame: rail or tab bar, no marketing footer (APP-1)", async ({ page }) => {
  const phone = page.viewportSize()!.width < 640;
  await page.goto("/paths");
  await expect(page.locator("html")).toHaveAttribute("data-frame", "app");
  await expect(page.getByRole("contentinfo")).toBeHidden();
  if (phone) {
    await expect(page.getByRole("navigation", { name: "App" })).toBeHidden();
    await expect(page.getByRole("navigation", { name: "Your places" }).getByRole("link")).toHaveText(["Home", "Learn", "Practice", "Interview", "AI"]);
  } else {
    const rail = page.getByRole("navigation", { name: "App" });
    await expect(rail.getByRole("link", { name: "Learn", exact: true })).toHaveAttribute("aria-current", "page");
    for (const name of ["Home", "Practice", "Interview", "AI Studio", "Career"]) await expect(rail.getByRole("link", { name, exact: true })).toBeVisible();
    await expect(page.getByRole("banner").locator(".app-only").getByText("Learn", { exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main" }).first()).toBeHidden();
    // A place shows its pages on hover, from the menu.
    await rail.getByRole("link", { name: "AI Studio", exact: true }).hover();
    await expect(rail.getByRole("link", { name: /Study from my notes & books/ })).toBeVisible();
  }
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("signed in, the landing page stays the website, with a way into the app (APP-1)", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-frame", "app");
  await expect(page.getByRole("navigation", { name: "App" })).toBeHidden();
  await expect(page.getByRole("contentinfo")).toBeAttached();
  if (page.viewportSize()!.width >= 640) await expect(page.getByRole("banner").getByRole("link", { name: "Go to my app" })).toHaveAttribute("href", "/dashboard");
});

test("the app frame is there from the first paint on a return visit (APP-1)", async ({ page }) => {
  await page.goto("/practice");
  await expect(page.locator("html")).toHaveAttribute("data-frame", "app");
  await page.addInitScript(() => document.addEventListener("DOMContentLoaded", () => ((window as unknown as { firstFrame?: string }).firstFrame = document.documentElement.dataset.frame)));
  await page.goto("/ai/book");
  expect(await page.evaluate(() => (window as unknown as { firstFrame?: string }).firstFrame)).toBe("app");
});

test("the rail's X mark stays dark on the light rail, even with the computer in dark mode (APP-1)", async ({ page }) => {
  test.skip(page.viewportSize()!.width < 640, "the rail is from 640 px");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/paths");
  const mark = page.getByRole("navigation", { name: "App" }).getByRole("link", { name: "Xplaind home" }).locator("path").first();
  await expect(mark).toHaveCSS("fill", "rgb(12, 63, 68)"); // brand-800 on the light site
});
