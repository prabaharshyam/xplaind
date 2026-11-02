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

test("the home page says what to do and leads to roadmaps, topics, courses and interviews", async ({ page }) => {
  await page.goto("/");
  const main = page.getByRole("main");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Learn AI for the job you want");
  await expect(main.getByRole("link", { name: "Find my level" }).first()).toHaveAttribute("href", "/start");
  await expect(main.getByRole("heading", { level: 2, name: "Choose your AI role" })).toBeVisible();
  await expect(main.getByRole("link", { name: /^AI Engineer/ })).toHaveAttribute("href", "/roadmap/ai-engineer");
  await expect(main.getByRole("link", { name: /AI Governance & Compliance Specialist/ }).first()).toHaveAttribute("href", "/roadmap/ai-governance-specialist");
  await expect(page.locator(".home-hero").getByText(/\bfree\b/i)).toHaveCount(0);
  await expect(main.getByRole("link", { name: "I have an interview soon" })).toHaveAttribute("href", "/interview/simulator");
  // the nine role roadmaps are right there, as cards
  await expect(main.getByRole("link", { name: /Forward Deployed Engineer/ }).first()).toHaveAttribute("href", "/roadmap/forward-deployed-engineer");
  await expect(main.getByRole("heading", { name: "Sound familiar?" })).toBeVisible();
  await expect(main.getByRole("link", { name: "Find my level" }).first()).toHaveAttribute("href", "/start");
  // the removed sections stay removed
  await expect(page.getByText("Honest by design")).toHaveCount(0);
  await expect(page.getByText("Where this is going")).toHaveCount(0);
  const nav = page.getByRole("banner");
  await nav.locator("summary").click(); // phone width: the links sit in the menu
  for (const [name, href] of [["Library", "/library"], ["Videos", "/videos"], ["Practice", "/practice"], ["Mock interview", "/interview/simulator"], ["Community", "/community"], ["Roadmaps", "/paths"]]) {
    await expect(nav.getByRole("link", { name, exact: true }).first()).toHaveAttribute("href", href);
  }
});

test("search finds lessons and opens them", async ({ page }) => {
  await page.goto("/");
  // Search lives in the header on every page (the home page's own search block was removed).
  await page.getByRole("banner").getByRole("button", { name: "Search" }).click();
  const box = page.getByRole("combobox", { name: /Search lessons/ });
  await box.fill("build a rag");
  await expect(page.getByRole("option").first()).toContainText("Build a RAG app");
  await box.press("Enter");
  await expect(page).toHaveURL(/\/stop\/rag-app$/);
});

test("the home page passes the accessibility scan once scrolled through", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 400) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(900); // let the last reveals finish
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("with reduced motion, everything is visible and accessible at once", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 360, height: 740 } });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByRole("heading", { name: "Sound familiar?" }).scrollIntoViewIfNeeded();
  await expect(page.getByText("I freeze in interviews", { exact: false })).toBeVisible();
  expect((await wcag(page)).violations).toEqual([]);
  await context.close();
});

test("the course directory lists every course and filters them", async ({ page }) => {
  await page.goto("/resources");
  await expect(page.getByRole("heading", { level: 1, name: "AI courses, hand-picked" })).toBeVisible();
  const items = page.getByRole("main").getByRole("article");
  await expect(page.getByText(/^Showing 24 of \d{3}$/)).toBeVisible();
  expect(await items.count()).toBe(24);
  await page.getByRole("button", { name: "Show more courses" }).click();
  expect(await items.count()).toBe(48);
  await page.getByRole("button", { name: /Agents/, pressed: false }).click();
  await expect(page.getByText(/^Showing \d+ of \d+ \(\d{3} in all\)$/)).toBeVisible();
  await page.getByRole("button", { name: /All topics/ }).click();
  await page.getByLabel("Only courses with a certificate or badge").check();
  await expect(items.first().getByText("Certificate", { exact: true })).toBeVisible();
  await page.getByLabel("Search by title or provider").fill("Anthropic Academy");
  await expect(items.first()).toContainText("Anthropic Academy");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("the logo, favicon and footer community invite are in place", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByRole("banner").getByRole("link", { name: "Xplaind home" }).locator("img").first()).toHaveAttribute("alt", "Xplaind");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "Join the community" })).toHaveAttribute("href", "/community");
  for (const p of ["/favicon.ico", "/icon.png", "/apple-icon.png", "/brand/xplaind-logo.png", "/brand/xplaind-logo-dark.png"]) {
    expect((await request.get(p)).status(), p).toBe(200);
  }
  await page.goto("/community");
  await expect(page.getByRole("link", { name: /Join on WhatsApp/ })).toHaveAttribute("href", /^https:\/\/chat\.whatsapp\.com\//);
});

test("the road keeps the screen's size after navigating back home (MO-6)", async ({ page }) => {
  await page.goto("/paths", { waitUntil: "networkidle" });
  // A marker on window survives only an in-site navigation, which is where the bug was.
  await page.evaluate(() => Object.assign(window, { stayedOnPage: true }));
  await page.getByRole("link", { name: "Xplaind home" }).first().click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => (window as unknown as { stayedOnPage?: boolean }).stayedOnPage)).toBe(true);
  const canvas = page.locator(".journey-sky canvas");
  const webgl = await page.evaluate(() => Boolean(document.createElement("canvas").getContext("webgl2") ?? document.createElement("canvas").getContext("webgl")));
  test.skip(!webgl, "no WebGL in this browser: the road is not drawn, so there is nothing to size");
  await expect(canvas).toHaveCount(1, { timeout: 10_000 });
  // The layer fills the screen, and its drawing buffer has the screen's shape, not the shape of
  // the whole page it was briefly stretched to (which drew the road zoomed in until a refresh).
  await expect
    .poll(() =>
      canvas.evaluate((c: HTMLCanvasElement) => c.clientHeight === window.innerHeight && Math.abs(c.width / c.height - c.clientWidth / c.clientHeight) < 0.02),
    )
    .toBe(true);
});
