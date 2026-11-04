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


test("key pages pass the accessibility check in dark mode too (A11Y-3)", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme: "dark", reducedMotion: "reduce" });
  const page = await ctx.newPage();
  for (const url of ["/", "/paths", "/roadmap/ai-engineer", "/stop/rag-app", "/library", "/jobs", "/practice", "/about"]) {
    await page.goto(url);
    expect((await wcag(page)).violations, url).toEqual([]);
  }
  await ctx.close();
});

test("the menu is grouped and marks the section you are in (NV-1 to NV-3)", async ({ page }) => {
  await page.goto("/jobs");
  const menu = page.locator(".site-header details.site-menu");
  await menu.locator("summary").click();
  const panel = menu.getByRole("navigation", { name: "Main" });
  await expect(panel).toBeVisible();
  // Full height: the panel reaches the bottom of the screen.
  const box = (await panel.boundingBox())!;
  expect(box.y + box.height).toBeGreaterThan(730);
  await expect(panel.getByRole("link", { name: "Jobs and salaries" })).toHaveAttribute("aria-current", "page");
  await expect(panel.getByText("Learn", { exact: true })).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/roadmap/ai-engineer");
  const desktop = page.locator(".site-header nav[aria-label='Main']").first();
  await expect(desktop.locator("summary", { hasText: "Learn" })).toContainText("current section");
  await desktop.locator("summary", { hasText: "Practice" }).click();
  await desktop.getByRole("link", { name: /Mock interview/ }).click();
  await expect(page).toHaveURL(/\/interview\/simulator$/);
});

test("a link clicked while the page is still scrolling opens the next page at the top (NV-4)", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  for (const from of ["/library", "/roadmap/ai-engineer", "/stop/evals-test-sets"]) {
    await page.goto(from);
    await page.waitForTimeout(1500); // the smooth scroller loads
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(600);
    const href = await page.locator("main a[href^='/stop/']").evaluateAll((as) => {
      const seen = as.find((a) => {
        const r = a.getBoundingClientRect();
        return r.width > 0 && r.top > 120 && r.bottom < innerHeight - 60 && a.getAttribute("href") !== location.pathname;
      });
      return seen?.getAttribute("href") ?? null;
    });
    if (!href) continue;
    await page.mouse.wheel(0, 600);
    // Click while the page is still gliding. A pointer click could miss the moving link, so the
    // link is clicked directly; it still runs the site's own navigation.
    await page.locator(`main a[href='${href}']`).first().evaluate((a: HTMLAnchorElement) => a.click());
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.scrollY), `${from} -> ${href}`).toBeLessThan(5);
  }
  await ctx.close();
});

test("a lesson opens at its top, not at a widget further down (NV-4)", async ({ page }) => {
  for (const url of ["/stop/agent-failures", "/stop/evals-test-sets", "/stop/python-basics"]) {
    await page.goto(url);
    await page.waitForTimeout(2000); // widgets, the tutor and the smooth scroller have loaded
    expect(await page.evaluate(() => window.scrollY), url).toBeLessThan(5);
  }
});
