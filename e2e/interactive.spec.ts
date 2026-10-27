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
  await expect(drawer.getByText("Best course", { exact: true })).toBeVisible();
  expect((await wcag(page)).violations).toEqual([]);
  await drawer.getByRole("button", { name: "Done", exact: true }).click();
  await expect(drawer.getByRole("button", { name: "Done", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(page.getByRole("link", { name: /^Build a RAG app, Done/ }).first()).toBeVisible();
  // the header now shows XP
  await expect(page.getByRole("banner").getByRole("link", { name: /\d+ XP/ })).toBeVisible();
});

test("the GenAI roadmap's topics open the drawer too", async ({ page }) => {
  await page.goto("/roadmap/genai-engineer");
  await page.getByRole("tabpanel").getByRole("link", { name: /^What AI, machine learning and a language model are/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("link", { name: /Read the lesson/ })).toHaveAttribute("href", "/stop/what-is-ai");
});

test("topic pages list lessons as cards", async ({ page }) => {
  await page.goto("/topics");
  await page.getByRole("link", { name: /^Agents/ }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Agents" })).toBeVisible();
  await expect(page.getByRole("link", { name: /The agent loop/ })).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("a lesson shows its parts, a reading guide and XP for the check", async ({ page }) => {
  await page.goto("/stop/what-is-ai");
  await expect(page.getByText("Part 1 of 5")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Check/ })).toContainText("+50 XP");
  await expect(page.getByRole("navigation", { name: /Lessons on the/ }).getByText("Next →")).toBeVisible();
  expect(await overflow(page)).toBe(false);
});

test("the progress page shows XP, streak and badges without an account", async ({ page }) => {
  await page.addInitScript(() => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    localStorage.setItem(
      "xplaind.progress.v1",
      JSON.stringify({ version: 1, freeOnly: false, stops: { "what-is-ai": { status: "done", how: "check", score: 100, updatedOn: today } } }),
    );
  });
  await page.goto("/dashboard");
  await expect(page.getByRole("region", { name: "XP and streak" }).getByText("70 XP", { exact: true })).toBeVisible();
  await expect(page.getByText("Earned: Finish your first lesson")).toBeVisible();
  await expect(page.getByText("Earned: Score 100% on a lesson check")).toBeVisible();
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
    await drawer.getByRole("link", { name: /Read the lesson/ }).click();
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

test("the top bar is light again after leaving the home page", async ({ page }) => {
  await page.goto("/");
  const header = page.locator(".site-header");
  const dark = () => header.evaluate((h) => getComputedStyle(h).backgroundColor);
  const onHome = await dark();
  await page.locator('main a[href="/paths"]:visible').first().click();
  await expect(page).toHaveURL(/\/paths$/);
  await expect.poll(dark).not.toBe(onHome);
});
