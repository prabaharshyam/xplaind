import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("home page loads at 360px with no horizontal scroll", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
});

test("search engines are asked not to list the site before launch", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Disallow: \/\s*$/m);
});

const wcag = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

test("the home page leads to the test, roadmap, courses and interview prep", async ({ page }) => {
  await page.goto("/");
  const main = page.getByRole("main");
  await expect(main.getByRole("link", { name: "Find my level" }).first()).toHaveAttribute("href", "/start");
  await expect(main.getByRole("link", { name: "See the roadmap" })).toHaveAttribute("href", "/roadmap/genai-engineer");
  await expect(main.getByRole("link", { name: "Start practising" })).toHaveAttribute("href", "/practice");
  await expect(main.getByRole("link", { name: "How we rank courses" })).toHaveAttribute("href", "/how-we-rank");
  const nav = page.getByRole("banner");
  await nav.locator("summary").click(); // phone width: the links sit in the menu
  for (const [name, href] of [["Courses", "/resources"], ["Interview", "/interview"], ["Practice", "/practice"], ["Paths", "/paths"]]) {
    await expect(nav.getByRole("link", { name, exact: true }).first()).toHaveAttribute("href", href);
  }
});

test("the home page passes the accessibility scan once scrolled through", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 400) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(1200); // let the last reveals finish
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("with reduced motion, everything is visible and accessible at once", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 360, height: 740 } });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByText("Ten minutes from now, you will know your next step.")).toBeVisible();
  expect(await page.locator(".lx-word").first().evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  expect((await wcag(page)).violations).toEqual([]);
  await context.close();
});

test("the courses page lists every course with its card", async ({ page }) => {
  await page.goto("/resources");
  await expect(page.getByRole("heading", { level: 1, name: "Courses" })).toBeVisible();
  expect(await page.getByRole("article").count()).toBeGreaterThan(40);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});
