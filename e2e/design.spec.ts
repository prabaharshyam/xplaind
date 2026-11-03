import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcag = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test.use({ viewport: { width: 360, height: 740 } });

test("a lesson on a phone starts with the answer and keeps Learning, Done and Skip in a bottom bar (BR-3)", async ({ page }) => {
  await page.goto("/stop/python-basics");
  const answer = page.getByRole("heading", { name: "Quick answer" });
  await expect(answer).toBeVisible();
  // The answer is reached within the first two screens, not after tags, buttons and videos.
  expect((await answer.boundingBox())!.y).toBeLessThan(740 * 1.5);
  const bar = page.locator(".lx-trackbar");
  await expect(bar).toBeVisible();
  const box = (await bar.boundingBox())!;
  expect(box.y + box.height).toBeGreaterThan(730);
  await bar.getByRole("button", { name: "Done" }).click();
  await expect(bar.getByRole("button", { name: "Done" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Related" })).toBeVisible();
  expect(await overflow(page)).toBe(false);
});

test("a roadmap leads with its first lesson and keeps the PDF as a second choice (BR-3)", async ({ page }) => {
  await page.goto("/roadmap/ai-engineer");
  const start = page.getByRole("link", { name: "Start the first lesson" });
  await expect(start).toBeVisible();
  await expect(start).toHaveAttribute("href", /^\/stop\//);
  await expect(page.getByRole("button", { name: "Download the PDF" })).toBeVisible();
  expect(await overflow(page)).toBe(false);
});

test("the Library folds its filters on phones and names levels in words (BR-3)", async ({ page }) => {
  await page.goto("/library");
  const toggle = page.getByRole("button", { name: "Topic and level" });
  await expect(toggle).toBeVisible();
  await expect(page.getByRole("button", { name: "Intermediate 2" })).toBeHidden();
  await toggle.click();
  await page.getByRole("button", { name: "Intermediate 2" }).click();
  await expect(page).toHaveURL(/level=I2/);
  await expect(page.getByRole("button", { name: /Hide filters/ })).toBeVisible();
  expect(await overflow(page)).toBe(false);
});

test("the About, Privacy and Terms pages are linked from the footer and accessible (BR-4)", async ({ page }) => {
  for (const [name, href, h1] of [
    ["About", "/about", /Help India learn AI faster/],
    ["Privacy", "/privacy", "Privacy policy"],
    ["Terms", "/terms", "Terms of use"],
  ] as const) {
    await page.goto("/");
    await expect(page.getByRole("contentinfo").getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
    await page.goto(href);
    await expect(page.getByRole("heading", { level: 1, name: h1 })).toBeVisible();
    expect(await overflow(page)).toBe(false);
    expect((await wcag(page)).violations).toEqual([]);
  }
});

test("the About page tells the founder's story with his photo and LinkedIn (TR-2)", async ({ page }) => {
  await page.goto("/about#founder");
  const founder = page.locator("#founder");
  await expect(founder.getByRole("heading", { name: "Meet the founder" })).toBeVisible();
  await expect(founder.getByRole("img", { name: /Shyam Prabahar/ })).toBeVisible();
  await expect(founder.getByText(/Tamil medium/)).toBeVisible();
  await expect(founder.getByRole("link", { name: /Connect on LinkedIn/ })).toHaveAttribute("href", "https://www.linkedin.com/in/shyam-prabahar/");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Meet the founder" })).toHaveAttribute("href", "/about#founder");
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

