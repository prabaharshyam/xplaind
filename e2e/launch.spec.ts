import { expect, test } from "@playwright/test";

// LR-1 and LR-2 (2026-11-20, launch check before the Product Hunt launch).
test("the usual sign-in and sign-up addresses reach the real page (LR-1)", async ({ page }) => {
  await page.goto("/signup");
  await expect(page).toHaveURL(/\/signin$/);
  await page.goto("/login");
  await expect(page).toHaveURL(/\/signin\?mode=signin$/);
});

test("a link that leads nowhere gets a friendly page with a way on (LR-2)", async ({ page }) => {
  const res = await page.goto("/this-page-does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "This page isn't here" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Practise with Zarina" })).toHaveAttribute("href", "/interview/simulator");
});
