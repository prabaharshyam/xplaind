import { expect, test } from "./signed-in";

// APP-0: the seam itself. If these fail, every other signed-in test is meaningless.
test("the browser and the server both see the signed-in learner (APP-0)", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1, name: /^(Good (morning|afternoon|evening)|Welcome back)$/ })).toBeVisible();
  await expect(page.getByText(/not fully configured/)).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("link", { name: /^sign in$/i })).toHaveCount(0);
});

test("a signed-in learner gets the phone tab bar (APP-0, NV-11)", async ({ page }) => {
  test.skip(page.viewportSize()!.width > 640, "the tab bar is for phones");
  await page.goto("/paths");
  await expect(page.getByRole("navigation", { name: "Your places" })).toBeVisible();
});
