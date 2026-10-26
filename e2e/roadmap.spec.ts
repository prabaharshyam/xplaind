import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
const wcag = (page: Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

/** A saved result with no answers places the learner at B1 with no gaps. */
async function seedB1Result(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem("xplaind.attempt.v1")) {
      localStorage.setItem(
        "xplaind.attempt.v1",
        JSON.stringify({ version: 1, goal: "genai-engineer", weeklyHours: 5, completedOn: "2026-10-25", answers: [] }),
      );
    }
  });
}

test.describe("roadmap (RM-1)", () => {
  test("shows all nine levels as a path, signed out, at 360px", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/roadmap/genai-engineer");
    await expect(page.getByRole("heading", { level: 1, name: "GenAI Engineer" })).toBeVisible();
    for (const id of ["B1", "B2", "B3", "I1", "I2", "I3", "P1", "P2", "P3"]) {
      await expect(page.getByRole("heading", { level: 2, name: new RegExp(`^${id} `) })).toBeVisible();
    }
    await expect(page.getByRole("main").getByRole("link", { name: "Find my level" })).toBeVisible();
    // the complete outline shows, including topics with no lesson yet
    await expect(page.getByText("Prompt injection defence")).toBeVisible();
    await expect(page.getByText("Coming soon").first()).toBeVisible();
    await expect(page.getByText("Level project:").first()).toBeVisible();
    expect(await overflow(page)).toBe(false);
    expect((await wcag(page)).violations).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("marks the start level from the saved result and ticks a skipped stop", async ({ page }) => {
    await seedB1Result(page);
    await page.goto("/stop/what-is-ai");
    await page.getByRole("button", { name: "I already know this" }).click();
    await expect(page.getByText("you said you already know this")).toBeVisible();

    await page.goto("/roadmap/genai-engineer");
    await expect(page.getByText("You start here")).toBeVisible();
    await expect(page.getByRole("heading", { name: "You start at B1" })).toBeVisible();
    await expect(page.getByRole("link", { name: /AI, machine learning and language models.*Done/ })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Roadmap covered" })).not.toHaveAttribute("aria-valuenow", "0");
    expect((await wcag(page)).violations).toEqual([]);
  });

  test("the map works at desktop width too", async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.goto("/roadmap/genai-engineer");
    await page.getByRole("navigation", { name: "Levels" }).getByRole("link", { name: /^I2 / }).click();
    await expect(page.getByRole("heading", { level: 2, name: "I2 RAG builder" })).toBeInViewport();
    expect(await overflow(page)).toBe(false);
    expect((await wcag(page)).violations).toEqual([]);
  });

  test("a level page lists its steps, and an unknown level is not found", async ({ page }) => {
    await page.goto("/roadmap/genai-engineer/b2");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("B2 Python starter");
    await expect(page.getByRole("link", { name: /Variables, loops and functions in Python/ })).toBeVisible();
    expect((await wcag(page)).violations).toEqual([]);
    await page.goto("/roadmap/genai-engineer/p2");
    await expect(page.getByRole("link", { name: /Deploy and monitor an LLM app/ })).toBeVisible();
    await page.goto("/roadmap/genai-engineer/x9");
    await expect(page.getByText("This page could not be found")).toBeVisible();
  });
});

test.describe("stop page (RM-2, RM-4, RM-7)", () => {
  test("shows full resource cards and passes the accessibility scan", async ({ page }) => {
    await page.goto("/stop/what-is-ai");
    const card = page.getByRole("article").first();
    await expect(card.getByText("Start here")).toBeVisible();
    for (const label of ["Cost", "Time", "Language", "Certificate", "Level", "Last verified", "Link checked"]) {
      await expect(card.getByText(label, { exact: true })).toBeVisible();
    }
    // sample resources are drafts, so no verification date is claimed
    await expect(card.getByText("Not yet verified")).toBeVisible();
    await expect(card.getByRole("link", { name: "How we rank" })).toHaveAttribute("href", "/how-we-rank");
    await expect(card.getByRole("link", { name: /^Watch the video|^Open the course/ })).toHaveAttribute(
      "href",
      /^\/go\/[a-z0-9-]+\?stop=what-is-ai$/,
    );
    expect(await overflow(page)).toBe(false);
    expect((await wcag(page)).violations).toEqual([]);
  });

  test("passing the check marks the stop done; failing keeps it in progress", async ({ page }) => {
    await page.goto("/stop/what-is-ai");
    const groups = page.locator("#check").getByRole("group"); // key terms are groups too (details)
    const count = await groups.count();
    // answer every question with its first option, which is not always right
    for (let i = 0; i < count; i++) await groups.nth(i).getByRole("radio").first().check();
    await page.getByRole("button", { name: "Check my answers" }).click();
    await expect(page.getByText(/You scored \d+%\. You need 70%/)).toBeVisible();
    await expect(page.getByText("In progress", { exact: true })).toBeVisible();

    // retake, picking the options the first try revealed as right
    const right = await page.locator("label", { hasText: "(right answer)" }).allTextContents();
    await page.getByRole("button", { name: "Try the check again" }).click();
    for (const text of right) await page.getByLabel(text.replace(" (right answer)", ""), { exact: true }).check();
    await page.getByRole("button", { name: "Check my answers" }).click();
    await expect(page.getByText("You scored 100%. Step done.")).toBeVisible();
    await expect(page.getByText("passed the check")).toBeVisible();
    expect((await wcag(page)).violations).toEqual([]);
  });

  test("a project stop is done when a link is submitted", async ({ page }) => {
    await page.goto("/stop/use-an-assistant");
    await page.getByRole("button", { name: "Submit my project" }).click();
    await expect(page.getByText("Paste a full web link")).toBeVisible();
    await page.getByLabel(/Link to your project/).fill("https://github.com/learner/prompts");
    await page.getByRole("button", { name: "Submit my project" }).click();
    await expect(page.getByText("project submitted")).toBeVisible();
    await expect(page.getByRole("link", { name: "https://github.com/learner/prompts" })).toBeVisible();
  });
});

test.describe("outbound links (RM-5, SC-4)", () => {
  test("/go redirects a known resource and returns 404 for an unknown one", async ({ request }) => {
    const ok = await request.get("/go/cs50p?stop=python-basics", { maxRedirects: 0 });
    expect(ok.status()).toBe(302);
    expect(ok.headers().location).toBe("https://cs50.harvard.edu/python/");
    const missing = await request.get("/go/not-a-resource", { maxRedirects: 0 });
    expect(missing.status()).toBe(404);
    expect(missing.headers().location).toBeUndefined();
  });
});

test("the result page shows the next five steps (RM-3)", async ({ page }) => {
  await seedB1Result(page);
  await page.goto("/result");
  await expect(page.getByRole("heading", { name: "Your next five steps" })).toBeVisible();
  const steps = page.getByRole("heading", { name: "Your next five steps" }).locator("..").getByRole("listitem");
  await expect(steps.first()).toContainText("What AI, machine learning");
  expect(await steps.count()).toBeGreaterThan(0);
  expect(await steps.count()).toBeLessThanOrEqual(5);
  expect((await wcag(page)).violations).toEqual([]);
});

test("How we rank is linked from the footer", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: "How we rank" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "How we rank" })).toBeVisible();
});
