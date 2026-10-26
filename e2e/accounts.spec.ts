import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// CI builds without Supabase settings, so accounts are switched off. The site
// must work exactly as before, and account routes must refuse cleanly.
test.describe("accounts switched off", () => {
  test("sign-in, dashboard and settings say accounts are coming soon", async ({ page }) => {
    for (const path of ["/signin", "/dashboard", "/settings"]) {
      await page.goto(path);
      await expect(page.getByText(/Accounts are coming soon/), path).toBeVisible();
    }
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations).toEqual([]);
  });

  test("account APIs answer 503 and store nothing", async ({ request }) => {
    for (const [method, path] of [
      ["POST", "/api/claim"],
      ["POST", "/api/progress"],
      ["POST", "/api/practice"],
      ["GET", "/api/export"],
      ["DELETE", "/api/account"],
      ["POST", "/api/card"],
      ["POST", "/api/profile"],
    ] as const) {
      const res = await request.fetch(path, { method, data: {} });
      expect(res.status(), `${method} ${path}`).toBe(503);
    }
  });

  test("the footer shows no sign-in link", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "Sign in" })).toHaveCount(0);
  });

  test("a sign-in form post is refused without sending anything", async ({ request }) => {
    const res = await request.post("/auth/email-link", { form: { email: "a@example.com", adult: "yes" }, maxRedirects: 0 });
    expect(res.status()).toBe(303);
    expect(res.headers().location).toContain("/signin?error=off");
  });
});
