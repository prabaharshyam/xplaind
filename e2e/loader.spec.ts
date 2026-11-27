import { expect, test } from "@playwright/test";

// UX-7: the loading screen (the Xplaind X). It is there from the first paint, hides when the page is
// ready, comes back on a page or language change, and never takes taps.

test("UX-7: the loading screen is part of the page, hides once it is ready and never takes taps", async ({ page }) => {
  await page.goto("/");
  const splash = page.locator("#xp-splash");
  await expect(splash).toHaveAttribute("aria-hidden", "true");
  await expect(splash).toHaveAttribute("data-state", "idle", { timeout: 15_000 });
  await expect(splash).toHaveCSS("pointer-events", "none");
  await expect(splash).toHaveCSS("visibility", "hidden"); // after its fade
  await expect(page.locator("#xp-splash .xp-blade")).toHaveCount(3);
});

test("UX-7: switching a lesson to Tamil shows the loading screen, then hides it on the new page", async ({ page }) => {
  await page.goto("/stop/what-is-ai");
  const splash = page.locator("#xp-splash");
  await expect(splash).toHaveAttribute("data-state", "idle", { timeout: 15_000 });
  // Record every state the screen goes through, so a fast page change cannot slip past the check.
  await page.evaluate(() => {
    const el = document.getElementById("xp-splash")!;
    (window as unknown as { __states: string[] }).__states = [];
    new MutationObserver(() => (window as unknown as { __states: string[] }).__states.push(el.dataset.state ?? "")).observe(el, {
      attributes: true,
      attributeFilter: ["data-state"],
    });
  });
  await page.getByRole("navigation", { name: "Read this lesson in" }).locator("summary").click(); // LT-4: the languages are folded
  await page.getByRole("navigation", { name: "Read this lesson in" }).getByRole("link", { name: "தமிழ்" }).click();
  await expect(page).toHaveURL(/\/stop\/what-is-ai\/ta$/, { timeout: 30_000 });
  await expect(splash).toHaveAttribute("data-state", "idle", { timeout: 15_000 });
  const states = await page.evaluate(() => (window as unknown as { __states: string[] }).__states);
  expect(states[0]).toBe("nav");
  expect(states[states.length - 1]).toBe("idle");
});

test("UX-7: the loading screen stays still under reduced motion", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("#xp-splash .xp-blade-long")).toHaveCSS("animation-name", "none");
  await expect(page.locator("#xp-splash .xp-bar-fill")).toHaveCSS("animation-name", "none");
  await context.close();
});
