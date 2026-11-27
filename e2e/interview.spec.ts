import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { loadContent } from "../src/lib/content/load";
import { isHumanName } from "../src/lib/content/review";

const { bundle } = loadContent(path.resolve(__dirname, "../content"));
// IQ-6: only questions a person has signed off are on the site.
const questions = bundle.interview
  .map((q) => q.data)
  .filter((q) => isHumanName(q.reviewed_by));
const drafts = bundle.interview
  .map((q) => q.data)
  .filter((q) => !isHumanName(q.reviewed_by));

const overflow = (page: Page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
const wcag = (page: Page) =>
  new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

test.describe("interview questions (IQ-1, IQ-3)", () => {
  test("the list filters by topic and level", async ({ page }) => {
    await page.goto("/interview");
    await expect(
      page.getByText(`${questions.length} questions`, { exact: true }),
    ).toBeVisible();
    const rag = questions.filter((q) => q.topic === "rag").length;
    // Retried: a choice made before the page has finished starting up is not kept.
    await expect(async () => {
      await page.getByLabel("Topic").selectOption("rag");
      await expect(page.getByText(`${rag} questions`, { exact: true })).toBeVisible({ timeout: 1000 });
    }).toPass();
    await page.getByLabel("Level").selectOption("P3");
    // Worked out from the bank, so a new senior question does not break the test.
    const ragP3 = questions.filter((q) => q.topic === "rag" && q.level === "P3").length;
    await expect(page.getByText(`${ragP3} ${ragP3 === 1 ? "question" : "questions"}`, { exact: true })).toBeVisible();
    expect(await overflow(page)).toBe(false);
    expect((await wcag(page)).violations).toEqual([]);
  });

  // The bank is too big for one test: in chunks, the workers share the pages and no single test runs for many minutes.
  const CHUNK = 60;
  for (let from = 0; from < questions.length; from += CHUNK) {
    const part = questions.slice(from, from + CHUNK);
    test(`every question page has its parts, fits a phone and passes the accessibility scan (${from + 1} to ${from + part.length})`, async ({
      page,
    }) => {
      test.setTimeout(part.length * 4_000); // each page is loaded and scanned
      for (const q of part) {
        await page.goto(`/interview/${q.id}`);
        await expect(page.getByRole("heading", { level: 1 }), q.id).toHaveText(
          q.question,
        );
        for (const h of [
          "Short answer",
          "Deeper answer",
          "Follow-ups to expect",
          "Common mistakes",
          "Learn it",
        ]) {
          await expect(
            page.getByRole("heading", { name: h, exact: true }),
            `${q.id}: ${h}`,
          ).toBeVisible();
        }
        // ED-10 (2026-11-17): the owner reviewed every page, so no page carries a draft label.
        await expect(
          page.getByText("Draft: written with AI help"),
          q.id,
        ).toHaveCount(0);
        expect(await overflow(page), q.id).toBe(false);
        expect((await wcag(page)).violations, q.id).toEqual([]);
      }
    });
  }

  test("the sitemap lists every question page", async ({ request, page }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    for (const q of questions)
      expect(xml).toContain(`/interview/${q.id}</loc>`);
    // IQ-6: a question nobody has signed off has no page and is not listed.
    for (const q of drafts)
      expect(xml, q.id).not.toContain(`/interview/${q.id}</loc>`);
    if (drafts[0]) {
      await page.goto(`/interview/${drafts[0].id}`);
      await expect(
        page.getByRole("heading", { level: 1, name: "This page isn't here" }),
      ).toBeVisible();
    }
  });
});

test.describe("practice (IQ-4, IQ-5)", () => {
  test("a rating is saved and missed questions come back first", async ({
    page,
  }) => {
    await page.goto("/practice/rag");
    await page.getByRole("button", { name: "Start practicing" }).click();
    const first = (await page.locator("#card-question").textContent())!.trim();
    await page.getByRole("button", { name: "Show the short answer" }).click();
    await page.getByRole("button", { name: "Show the deeper answer" }).click();
    await expect(
      page.getByRole("heading", { name: "Deeper answer" }),
    ).toBeVisible();
    expect((await wcag(page)).violations).toEqual([]);
    await page.getByRole("button", { name: "Missed" }).click();
    await expect(page.getByText("Card 2 of")).toBeVisible();
    await expect(
      page.getByText(/^1 of \d+ practiced: 0 got it, 0 partly, 1 missed/),
    ).toBeVisible();

    // the rating survives a reload, and the list shows it (IP-7: the list shows 20 at a time, so open its topic)
    await page.goto("/interview?topic=rag");
    await expect(
      page.getByRole("button", {
        name: new RegExp(`${first.slice(0, 20)}.*You said: missed`),
      }),
    ).toBeVisible();

    // next round: unrated questions first, the missed one after them
    await page.goto("/practice/rag");
    await page.getByRole("button", { name: "Continue practicing" }).click();
    await expect(page.locator("#card-question")).not.toHaveText(first);
  });

  test("a quick quiz can be taken and scored", async ({ page }) => {
    await page.goto("/practice/agents");
    await page.getByRole("button", { name: "Start a quiz" }).click();
    const groups = page.getByRole("main").getByRole("group");
    const n = await groups.count();
    expect(n).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < n; i++)
      await groups.nth(i).getByRole("radio").first().check();
    await page.getByRole("button", { name: "Check my answers" }).click();
    await expect(page.getByText(/You scored \d+%/)).toBeVisible();
    expect(await overflow(page)).toBe(false);
    expect((await wcag(page)).violations).toEqual([]);
  });

  test("a lesson lists the interview questions that link to it", async ({
    page,
  }) => {
    await page.goto("/stop/rag-app");
    await expect(
      page.getByRole("heading", { name: "Interview questions on this" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: "What is RAG, and why would you use it?",
      }),
    ).toBeVisible();
  });
});
