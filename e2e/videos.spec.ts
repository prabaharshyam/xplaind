import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcag = (page: import("@playwright/test").Page) => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

const count = async (page: import("@playwright/test").Page) => {
  const text = (await page.getByText(/^Showing \d+ of \d+/).textContent()) ?? "";
  return Number(text.match(/of (\d+)/)![1]);
};

test("the videos page filters by topic, level, length and search, and shows view counts (VD-1)", async ({ page }) => {
  await page.goto("/videos");
  await expect(page.getByRole("heading", { level: 1, name: "AI video lessons, by topic" })).toBeVisible();
  const all = await count(page);
  expect(all).toBeGreaterThan(300);

  // view counts and their check date
  await expect(page.getByText(/\d[\d.]*[KM]? views · /).first()).toBeVisible();
  await expect(page.getByText(/View counts are public YouTube numbers, read on /)).toBeVisible();

  // a topic chip narrows the list and shows its own count
  const chip = page.getByRole("button", { name: /^Retrieval and RAG/ });
  const chipCount = Number(((await chip.textContent()) ?? "").match(/(\d+)$/)![1]);
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  expect(await count(page)).toBe(chipCount);
  expect(chipCount).toBeLessThan(all);

  // level and length narrow it further
  await page.getByLabel("Level").selectOption("B");
  const beginner = await count(page);
  expect(beginner).toBeLessThanOrEqual(chipCount);
  await page.getByLabel("Length").selectOption("short");
  expect(await count(page)).toBeLessThanOrEqual(beginner);

  // search, with a way back
  await page.getByLabel("Search by title, teacher or lesson").fill("zzzzqqqq");
  await expect(page.getByText("No videos match.")).toBeVisible();
  await page.getByRole("button", { name: "Clear the filters" }).click();
  expect(await count(page)).toBe(all);
});

test("sorting puts the most viewed first and the shortest first", async ({ page }) => {
  await page.goto("/videos");
  const views = async () => {
    const t = (await page.locator("article").first().getByText(/[\d.]+[KM]? views/).textContent()) ?? "";
    const n = Number(t.match(/([\d.]+)/)![1]);
    return t.includes("M") ? n * 1e6 : t.includes("K") ? n * 1e3 : n;
  };
  const top = await views();
  expect(top).toBeGreaterThan(100_000);
  await page.getByLabel("Sort by").selectOption("short");
  const first = (await page.locator("article").first().textContent()) ?? "";
  expect(first).toMatch(/\b[1-5] min\b/);
});

test("a video plays in place from the topic list", async ({ page }) => {
  await page.goto("/videos");
  await page.getByRole("button", { name: /^Watch/ }).first().click();
  await expect(page.locator("dialog[open] iframe")).toHaveAttribute("src", /youtube-nocookie\.com\/embed\//);
});

test("the videos page fits a 360px phone and passes the accessibility scan", async ({ page }) => {
  await page.goto("/videos");
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});
