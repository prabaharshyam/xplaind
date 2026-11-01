import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcag = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test("the books page lists books by topic, labels every affiliate link and fits a phone (BK-1, BK-2)", async ({ page }) => {
  await page.goto("/books");
  await expect(page.getByRole("heading", { level: 1, name: "Books worth reading" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "System design" })).toBeVisible();
  const buy = page.getByRole("link", { name: /^See it on Amazon India/ });
  const labels = page.getByText("Affiliate link: we may earn a commission", { exact: false });
  expect(await buy.count()).toBeGreaterThan(20);
  expect(await labels.count()).toBe(await buy.count());
  await expect(buy.first()).toHaveAttribute("href", /^\/go\/book\//);
  await expect(buy.first()).toHaveAttribute("rel", /sponsored/);
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("a book link redirects to Amazon India, and an unknown book is a 404", async ({ request }) => {
  const res = await request.get("/go/book/designing-data-intensive-applications", { maxRedirects: 0 });
  expect(res.status()).toBe(302);
  expect(res.headers().location).toMatch(/^https:\/\/www\.amazon\.in\/s\?k=Designing/);
  expect((await request.get("/go/book/nope", { maxRedirects: 0 })).status()).toBe(404);
});

test("lesson and topic pages show labelled books for their topic (BK-4)", async ({ page }) => {
  await page.goto("/stop/big-o-complexity");
  const books = page.locator("#books");
  await expect(books.getByRole("heading", { name: "Books on this topic" })).toBeVisible();
  await expect(books.getByRole("link", { name: /^See it on Amazon India/ }).first()).toBeVisible();
  await expect(books.getByText(/Affiliate link: we may earn a commission/).first()).toBeVisible();

  await page.goto("/topics/system-design");
  await expect(page.getByRole("heading", { name: "Books on system design" })).toBeVisible();

  await page.goto("/disclosure");
  await expect(page.getByText("As an Amazon Associate, we earn from qualifying purchases.")).toBeVisible();
  expect((await wcag(page)).violations).toEqual([]);
});
