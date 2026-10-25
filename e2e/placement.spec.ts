import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { loadContent } from "../src/lib/content/load";
import { splitStem } from "../src/lib/text";

const { bundle } = loadContent(path.resolve(__dirname, "../content"));
const bank = bundle.placement.map((q) => q.data);
const keyOf = (stem: string) => {
  const { text, code } = splitStem(stem);
  return `${text}\n${code ?? ""}`;
};
const byKey = new Map(bank.map((q) => [keyOf(q.stem), q]));

const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

const wcag = (page: Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

/** Answer whatever question is on screen: "right" picks the correct option, "idk" the last option. */
async function answerCurrent(page: Page, how: "right" | "idk") {
  const heading = (await page.getByRole("heading", { level: 1 }).textContent())!.trim();
  const code = (await page.locator("pre code").count()) ? ((await page.locator("pre code").textContent()) ?? "") : "";
  const q = byKey.get(`${heading}\n${code}`);
  expect(q, `question not found for "${heading}"`).toBeTruthy();
  if (how === "idk") {
    await page.getByLabel("I don't know").check();
  } else {
    const right = q!.options.find((o) => o.id === q!.correct)!;
    await page.getByLabel(right.text, { exact: true }).check();
  }
}

async function takeTest(page: Page, how: "right" | "idk") {
  await page.goto("/start");
  await page.getByRole("button", { name: "Start the test" }).click();
  for (let n = 1; n <= 12; n++) {
    await expect(page.getByText(`Question ${n} of up to 12`)).toBeVisible();
    await answerCurrent(page, how);
    await page.getByRole("button", { name: /^(Next|Finish)$/ }).click();
    const done = await expect
      .poll(async () => page.url().endsWith("/result") || (await page.getByText(`Question ${n + 1} of`).isVisible()), {
        timeout: 10_000,
      })
      .toBe(true)
      .then(() => page.url().endsWith("/result"));
    if (done) return n;
  }
  throw new Error("the test did not finish in 12 questions");
}

test.describe("placement test (PL-2, PL-3, PL-5)", () => {
  test("the start screen fits a 360px phone and passes the accessibility scan", async ({ page }) => {
    await page.goto("/start");
    await expect(page.getByRole("heading", { level: 1, name: "Find my level" })).toBeVisible();
    expect(await overflow(page)).toBe(false);
    expect((await wcag(page)).violations).toEqual([]);
  });

  test("a learner who knows everything finishes 12 questions and lands at the top of the ladder", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/start");
    await page.getByText("10 hours", { exact: true }).click();
    await expect(page.getByLabel("10 hours")).toBeChecked();
    await page.getByRole("button", { name: "Start the test" }).click();

    // a question screen is accessible and fits the phone
    await expect(page.getByText("Question 1 of up to 12")).toBeVisible();
    expect(await overflow(page)).toBe(false);
    expect((await wcag(page)).violations).toEqual([]);

    // a refresh keeps the learner's place
    await page.reload();
    await expect(page.getByText("Question 1 of up to 12")).toBeVisible();

    await page.goto("/start");
    const asked = await (async () => {
      for (let n = 1; n <= 12; n++) {
        await answerCurrent(page, "right");
        await page.getByRole("button", { name: /^(Next|Finish)$/ }).click();
        if (n < 12) await expect(page.getByText(`Question ${n + 1} of up to 12`)).toBeVisible();
      }
      return 12;
    })();
    expect(asked).toBe(12);

    await expect(page).toHaveURL(/\/result$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("top of the ladder: AI system designer");
    await expect(page.getByText("You passed P3")).toBeVisible();
    await expect(page.getByText("No gaps stood out")).toBeVisible();
    expect(await overflow(page)).toBe(false);
    expect((await wcag(page)).violations).toEqual([]);

    // refreshing keeps the result
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("top of the ladder");
    expect(errors).toEqual([]);
  });

  test("a learner who answers \"I don't know\" is placed at B1 with gaps to review", async ({ page }) => {
    const n = await takeTest(page, "idk");
    expect(n).toBeGreaterThanOrEqual(8);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Start at B1: AI newcomer");
    await expect(page.getByText("You did not pass a level yet")).toBeVisible();
    await expect(page.getByRole("heading", { name: "What to review first" })).toBeVisible();
    // B1 gap topics link to a sample review stop
    await expect(page.getByRole("link", { name: /^Review:/ }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Questions to learn from" })).toBeVisible();
    expect(await overflow(page)).toBe(false);
  });

  test("no question is wider than a 360px phone, including long code lines", async ({ page }) => {
    await page.goto("/start");
    for (const q of bank) {
      await page.evaluate(
        ([id, level]) =>
          localStorage.setItem(
            "xplaind.test.v1",
            JSON.stringify({ goal: "genai-engineer", weeklyHours: 5, state: { answers: [], level, currentId: id, done: false } }),
          ),
        [q.id, q.level],
      );
      await page.reload();
      await expect(page.getByText("Question 1 of up to 12")).toBeVisible();
      expect(await overflow(page), q.id).toBe(false);
    }
  });

  test("the result page without a saved result invites the learner to take the test", async ({ page }) => {
    await page.goto("/result");
    await expect(page.getByRole("link", { name: "Find my level" })).toBeVisible();
  });

  test("the whole flow works from the home page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Find my level" }).click();
    await expect(page).toHaveURL(/\/start$/);
  });
});
