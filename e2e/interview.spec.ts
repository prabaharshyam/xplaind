import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { loadContent } from "../src/lib/content/load";

const { bundle } = loadContent(path.resolve(__dirname, "../content"));
const questions = bundle.interview.map((q) => q.data);

const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
const wcag = (page: Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

test.describe("interview questions (IQ-1, IQ-3)", () => {
  test("the list filters by topic and level", async ({ page }) => {
    await page.goto("/interview");
    await expect(page.getByText(`${questions.length} questions`)).toBeVisible();
    await page.getByLabel("Topic").selectOption("rag");
    const rag = questions.filter((q) => q.topic === "rag").length;
    await expect(page.getByText(`${rag} questions`)).toBeVisible();
    await page.getByLabel("Level").selectOption("P3");
    await expect(page.getByText("0 questions")).toBeVisible();
    expect(await overflow(page)).toBe(false);
    expect((await wcag(page)).violations).toEqual([]);
  });

  test("every question page has its parts, fits a phone and passes the accessibility scan", async ({ page }) => {
    test.setTimeout(180_000);
    for (const q of questions) {
      await page.goto(`/interview/${q.id}`);
      await expect(page.getByRole("heading", { level: 1 }), q.id).toHaveText(q.question);
      for (const h of ["Short answer", "Deeper answer", "Follow-ups to expect", "Common mistakes", "Learn it"]) {
        await expect(page.getByRole("heading", { name: h, exact: true }), `${q.id}: ${h}`).toBeVisible();
      }
      await expect(page.getByText("Draft: written with AI help"), q.id).toBeVisible();
      expect(await overflow(page), q.id).toBe(false);
      expect((await wcag(page)).violations, q.id).toEqual([]);
    }
  });

  test("the sitemap lists every question page", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    for (const q of questions) expect(xml).toContain(`/interview/${q.id}</loc>`);
  });
});

test.describe("practice (IQ-4, IQ-5)", () => {
  test("a rating is saved and missed questions come back first", async ({ page }) => {
    await page.goto("/practice/rag");
    await page.getByRole("button", { name: "Start practising" }).click();
    const first = (await page.locator("#card-question").textContent())!.trim();
    await page.getByRole("button", { name: "Show the short answer" }).click();
    await page.getByRole("button", { name: "Show the deeper answer" }).click();
    await expect(page.getByRole("heading", { name: "Deeper answer" })).toBeVisible();
    expect((await wcag(page)).violations).toEqual([]);
    await page.getByRole("button", { name: "Missed" }).click();
    await expect(page.getByText("Question 2 of")).toBeVisible();
    await expect(page.getByText("1 of 5 practised: 0 got it, 0 partly, 1 missed")).toBeVisible();

    // the rating survives a reload, and the list shows it
    await page.goto("/interview");
    await expect(page.getByRole("link", { name: new RegExp(`${first.slice(0, 20)}.*You said: missed`) })).toBeVisible();

    // next round: unrated questions first, the missed one after them
    await page.goto("/practice/rag");
    await page.getByRole("button", { name: "Continue practising" }).click();
    await expect(page.locator("#card-question")).not.toHaveText(first);
  });

  test("a quick quiz can be taken and scored", async ({ page }) => {
    await page.goto("/practice/agents");
    await page.getByRole("button", { name: "Start a quiz" }).click();
    const groups = page.getByRole("group");
    const n = await groups.count();
    expect(n).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < n; i++) await groups.nth(i).getByRole("radio").first().check();
    await page.getByRole("button", { name: "Check my answers" }).click();
    await expect(page.getByText(/You scored \d+%/)).toBeVisible();
    expect(await overflow(page)).toBe(false);
    expect((await wcag(page)).violations).toEqual([]);
  });

  test("a lesson lists the interview questions that link to it", async ({ page }) => {
    await page.goto("/stop/rag-app");
    await expect(page.getByRole("heading", { name: "Interview questions on this" })).toBeVisible();
    await expect(page.getByRole("link", { name: "What is RAG, and why would you use it?" })).toBeVisible();
  });
});
