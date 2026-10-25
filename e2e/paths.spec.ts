import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
const wcag = (page: Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

const PATHS = [
  "GenAI Engineer",
  "Forward Deployed Engineer",
  "AI for Beginners",
  "Agentic AI Expert",
  "RAG Expert",
  "AI Automation Specialist",
  "LLMOps / AI Platform Engineer",
  "AI Product Manager",
  "ML Engineer",
];

test.describe("paths", () => {
  test("the chooser lists all nine paths at 360px", async ({ page }) => {
    await page.goto("/paths");
    await expect(page.getByRole("heading", { level: 1, name: "Choose a path" })).toBeVisible();
    for (const name of PATHS) await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
    expect(await overflow(page)).toBe(false);
    expect((await wcag(page)).violations).toEqual([]);
  });

  test("a staged path shows its stages, lessons, planned topics and projects", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/roadmap/forward-deployed-engineer");
    await expect(page.getByRole("heading", { level: 1, name: "Forward Deployed Engineer" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Engineering foundations" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "FDE craft and capstone" })).toBeVisible();
    await expect(page.getByText("Stage project").first()).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Find my level" })).toHaveAttribute("href", "/start/forward-deployed-engineer");
    expect(await overflow(page)).toBe(false);
    expect((await wcag(page)).violations).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("choosing a path keeps it on this device and follows it to the chooser and lessons", async ({ page }) => {
    await page.goto("/roadmap/ai-for-beginners");
    await expect(page.getByRole("main").getByRole("link", { name: "Find my level" })).toHaveCount(0); // no test on this path
    await page.getByRole("button", { name: "Make this my path" }).click();
    await expect(page.getByRole("heading", { name: "This is your path" })).toBeVisible();
    // next steps start at the first lesson, with nothing skipped
    await expect(page.getByRole("region", { name: "Your next five steps" }).getByRole("link").first()).toHaveAttribute("href", "/stop/what-is-ai");

    await page.goto("/paths");
    await expect(page.getByText("Your path is AI for Beginners.")).toBeVisible();

    await page.goto("/stop/what-is-ai");
    await expect(page.getByRole("main").getByRole("link", { name: "AI for Beginners" })).toBeVisible();
  });

  test("the level test can be taken for another path", async ({ page }) => {
    await page.goto("/start/forward-deployed-engineer");
    await expect(page.getByText("Forward Deployed Engineer")).toBeVisible();
    await expect(page.getByRole("link", { name: "Choose a different path" })).toHaveAttribute("href", "/paths");
  });

  test("a result taken for a path gives that path's next steps", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "xplaind.attempt.v1",
        JSON.stringify({ version: 1, goal: "forward-deployed-engineer", weeklyHours: 5, completedOn: "2026-10-25", answers: [] }),
      );
    });
    await page.goto("/result");
    await expect(page.getByText("Your result for the Forward Deployed Engineer path")).toBeVisible();
    const steps = page.getByRole("region", { name: "Your next five steps" }).getByRole("link");
    await expect(steps.first()).toHaveAttribute("href", "/stop/first-llm-api-call");
  });
});
