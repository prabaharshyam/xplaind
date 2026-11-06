import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loadContent } from "../src/lib/content/load";

const wcag = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test.use({ viewport: { width: 360, height: 740 } });

test("a roadmap topic opens a drawer where it can be marked done, without leaving the map", async ({ page }) => {
  await page.goto("/roadmap/forward-deployed-engineer");
  await page.getByRole("link", { name: /^Build a RAG app/ }).first().click();
  const drawer = page.getByRole("dialog", { name: "Build a RAG app" });
  await expect(drawer).toBeVisible();
  await expect(page).toHaveURL(/\/roadmap\/forward-deployed-engineer$/);
  await expect(drawer.getByText("Free resources", { exact: false }).first()).toBeVisible();
  // RM-13: the title, then what the topic is in one line; no outcome or "Why it matters".
  await expect(drawer.getByRole("heading", { name: "What it is" })).toBeVisible();
  await expect(drawer.getByText("Why it matters")).toHaveCount(0);
  await expect(drawer.getByRole("link", { name: "Read the full chapter" })).toHaveAttribute("href", "/stop/rag-app");
  expect((await wcag(page)).violations).toEqual([]);
  await drawer.getByRole("button", { name: "Done", exact: true }).click();
  await expect(drawer.getByRole("button", { name: "Done", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(page.getByRole("link", { name: /^Build a RAG app, Done/ }).first()).toBeVisible();
  // XP was removed (2026-11-06); the header shows the day streak instead.
  await expect(page.getByRole("banner").getByRole("link", { name: /-day streak/ })).toBeVisible();
  await expect(page.getByRole("banner").getByText(/\d+ XP/)).toHaveCount(0);
});

test("the GenAI roadmap's topics open the drawer too", async ({ page }) => {
  await page.goto("/roadmap/genai-engineer");
  await page.getByRole("tabpanel").getByRole("link", { name: /^What AI, machine learning and a language model are/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("link", { name: "Read the full chapter" })).toHaveAttribute("href", "/stop/what-is-ai");
});

test("topic pages list lessons as cards", async ({ page }) => {
  await page.goto("/topics");
  await page.getByRole("link", { name: /^Agents/ }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Agents" })).toBeVisible();
  await expect(page.getByRole("link", { name: /The agent loop/ })).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("a lesson shows its parts and a reading guide, and no XP", async ({ page }) => {
  await page.goto("/stop/what-is-ai");
  await expect(page.getByText("Part 1 of 5")).toBeVisible();
  await expect(page.getByText(/\bXP\b/)).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: /Lessons on the/ }).getByText("Next →")).toBeVisible();
  expect(await overflow(page)).toBe(false);
});

test("the progress page shows the streak and counts without an account, and no XP or badges", async ({ page }) => {
  await page.addInitScript(() => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    localStorage.setItem(
      "xplaind.progress.v1",
      JSON.stringify({ version: 1, freeOnly: false, stops: { "what-is-ai": { status: "done", how: "check", score: 100, updatedOn: today } } }),
    );
  });
  await page.goto("/dashboard");
  await expect(page.getByRole("region", { name: "Streak" }).getByText("1 day", { exact: true })).toBeVisible();
  await expect(page.getByText(/\bXP\b/)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Badges" })).toHaveCount(0);
  expect((await wcag(page)).violations).toEqual([]);
});

test("topics can be marked Learning, Done or Skip on the map, and the counts, filters and projects follow", async ({ page }) => {
  await page.goto("/roadmap/forward-deployed-engineer");
  const mark = async (n: number, label: "Learning" | "Done" | "Skip") => {
    await page.getByRole("button", { name: /^Mark / }).nth(n).click();
    await page.getByRole("group", { name: /^Your status for/ }).getByRole("button", { name: label, exact: true }).click();
    await page.getByRole("button", { name: /^Close / }).click();
  };
  await mark(0, "Done");
  await mark(1, "Learning");
  await mark(2, "Skip");
  const show = page.getByRole("group", { name: "Show topics" });
  await expect(show.getByRole("button", { name: "Done 1" })).toBeVisible();
  await expect(show.getByRole("button", { name: "Learning 1" })).toBeVisible();
  await expect(show.getByRole("button", { name: "Skipped 1" })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Roadmap finished" })).not.toHaveAttribute("aria-valuenow", "0");

  // filter to the topic being learnt
  await show.getByRole("button", { name: "Learning 1" }).click();
  await expect(page.getByRole("button", { name: /^Mark / })).toHaveCount(1);
  await show.getByRole("button", { name: /^All / }).click();

  // hide finished topics, remembered after a reload
  const before = await page.getByRole("button", { name: /^Mark / }).count();
  await page.getByLabel("Hide done and skipped").check();
  await expect(page.getByRole("button", { name: /^Mark / })).toHaveCount(before - 2);
  await page.reload();
  await expect(page.getByLabel("Hide done and skipped")).toBeChecked();
  await expect(page.getByRole("button", { name: /^Mark / })).toHaveCount(before - 2);
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);

  // projects tab: submit a stage project
  await page.getByRole("tab", { name: /Projects/ }).click();
  await expect(page).toHaveURL(/#projects$/);
  const first = page.getByRole("listitem").filter({ has: page.getByRole("heading", { level: 3 }) }).first();
  await first.getByLabel("Link to your project").fill("not a link");
  await first.getByRole("button", { name: "Mark project done" }).click();
  await expect(first.getByRole("alert")).toContainText("Paste a full web link");
  await first.getByLabel("Link to your project").fill("https://github.com/learner/doc-qa");
  await first.getByRole("button", { name: "Mark project done" }).click();
  await expect(page.getByText("1 of 6 projects done.")).toBeVisible();
  await expect(first.getByRole("link", { name: "https://github.com/learner/doc-qa" })).toBeVisible();
  expect((await wcag(page)).violations).toEqual([]);
});

test("on every roadmap, a lesson opened from the drawer still responds to clicks", async ({ page }) => {
  test.setTimeout(180_000);
  const { bundle } = loadContent(path.resolve(__dirname, "../content"));
  for (const { data: p } of bundle.goals) {
    await page.goto(`/roadmap/${p.id}`);
    await page.getByRole("tabpanel").getByRole("link", { name: /, (To do|Learning|Done|Skipped)$/ }).nth(1).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer, p.id).toBeVisible();
    await drawer.getByRole("link", { name: "Read the full chapter" }).click();
    await expect(page, p.id).toHaveURL(/\/stop\//);
    await expect(page.locator("dialog[open]"), p.id).toHaveCount(0);
    // a plain HTML control and a React button on the lesson both respond
    const terms = page.locator('section[aria-labelledby="terms-heading"] details').first();
    if (await terms.count()) {
      await terms.locator("summary").click();
      await expect(terms, p.id).toHaveAttribute("open", "");
    }
    const check = page.locator("#try-it").getByRole("button", { name: "Check your answers" });
    if (await check.count()) {
      await check.click();
      await expect(page.locator("#try-it").getByRole("region", { name: "Answers" }), p.id).toBeVisible();
    }
    const reveal = page.locator("#flashcards").getByRole("button", { name: "Reveal the answer" });
    if (await reveal.count()) {
      await reveal.click();
      await expect(reveal, p.id).toHaveCount(0);
    }
  }
});

test("the top bar is the same light, frosted bar on the home page and after leaving it (MO-5)", async ({ page }) => {
  await page.goto("/");
  const header = page.locator(".site-header");
  const tone = () => header.evaluate((h) => getComputedStyle(h).backgroundColor);
  const onHome = await tone();
  expect(onHome).toMatch(/255, 255, 255|oklab\(0\.99/); // white, however the browser writes it
  await page.locator('main a[href="/paths"]:visible').first().click();
  await expect(page).toHaveURL(/\/paths$/);
  await expect.poll(tone).toBe(onHome);
});

test("the phone menu closes after a page is chosen", async ({ page }) => {
  await page.goto("/");
  const menu = page.locator(".site-header details.site-menu");
  await menu.locator("summary").click();
  await expect(menu).toHaveAttribute("open", "");
  await menu.getByRole("link", { name: "Library", exact: true }).click();
  await expect(page).toHaveURL(/\/library$/);
  await expect(menu).not.toHaveAttribute("open");
  // Escape closes it too
  await menu.locator("summary").click();
  await expect(menu).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(menu).not.toHaveAttribute("open");
});

test("a roadmap topic's panel keeps videos for the lesson and folds resources into a dropdown (RM-13)", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark", reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/roadmap/forward-deployed-engineer");
  await page.locator("main a[href='/stop/docker-basics']").last().click();
  const drawer = page.getByRole("dialog", { name: "Docker and Compose" });
  await expect(drawer).toBeVisible();
  // No video players in the panel; the lesson page has them.
  await expect(drawer.getByRole("button", { name: /Watch here/ })).toHaveCount(0);
  // Resources start folded and open on a tap.
  const free = drawer.locator("details", { hasText: "Free resources" });
  await expect(free).not.toHaveAttribute("open");
  await free.locator("summary").click();
  await expect(free.getByRole("link").first()).toBeVisible();
  await expect(free.getByText("Best pick")).toBeVisible();
  // Closing the panel leaves no window open over the roadmap.
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  expect(await page.evaluate(() => document.querySelectorAll("dialog[open]").length)).toBe(0);
  await ctx.close();
});
