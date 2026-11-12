import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcag = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test.use({ viewport: { width: 360, height: 740 } });

test("the code playground offers starters and an editor, and lessons get Run buttons (PG-1, PG-2, PG-4, PG-5)", async ({ page }) => {
  await page.goto("/playground");
  await expect(page.getByRole("heading", { level: 1, name: /Write and run Python/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Fix the bug" }).click();
  await expect(page.getByLabel("Fix the bug")).toHaveValue(/range\(len\(prices\) \+ 1\)/);
  // PG-5: starters in three groups, each with one thing to try.
  for (const name of ["Warm-ups", "AI ideas", "Challenges"]) await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
  await page.getByRole("button", { name: /Temperature/ }).click();
  await expect(page.locator("p", { hasText: "Try this:" })).toContainText("temperature");
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);

  await page.goto("/stop/python-basics");
  const run = page.getByRole("button", { name: "Run this code" }).first();
  await expect(run).toBeVisible();
  await run.click();
  await expect(page.getByLabel("Try it: edit and run")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open in playground" })).toHaveAttribute("href", /^\/playground#code=/);
});

test("jobs and salaries show every role with dated pay, skills and live job links (JB-1 to JB-3)", async ({ page }) => {
  await page.goto("/jobs");
  await expect(page.getByRole("heading", { level: 1, name: "AI jobs and salaries in India" })).toBeVisible();
  await expect(page.getByText(/Salaries checked on \d{1,2} \w{3} 20\d\d/)).toBeVisible();
  const card = page.locator("#ai-engineer");
  await expect(card.getByRole("heading", { name: "AI Engineer" })).toBeVisible();
  await expect(card.getByText(/₹\d+–\d+ LPA/).first()).toBeVisible();
  await expect(card.getByRole("link", { name: /Live jobs on Naukri/ })).toHaveAttribute("href", "https://www.naukri.com/ai-engineer-jobs");
  await expect(card.getByRole("link", { name: /Live jobs on LinkedIn/ })).toHaveAttribute("href", /linkedin\.com\/jobs\/search\/\?keywords=AI%20Engineer&location=India/);
  expect(await page.locator("main li[id]").count()).toBe(9);
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
  // A roadmap links to its salary card.
  await page.goto("/roadmap/ai-engineer");
  await expect(page.getByRole("link", { name: /Salaries and live jobs for this role/ })).toHaveAttribute("href", "/jobs#ai-engineer");
});

test("Stay on track lists this week's lessons, follows the hours and offers a reminder (WP-1 to WP-3, FOCUS-2)", async ({ page }) => {
  await page.goto("/plan");
  await expect(page.getByRole("main").getByText("Stay on track", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your week" })).toBeVisible();
  const lessons = page.locator("main ol > li a[href^='/stop/']");
  await expect(lessons.first()).toBeVisible();
  const at6 = await lessons.count();
  await page.getByLabel("Hours a week").selectOption("15");
  await expect.poll(() => lessons.count()).toBeGreaterThan(at6);
  await expect(page.getByRole("link", { name: "Practice interview flashcards" })).toHaveAttribute("href", "/practice");
  await expect(page.getByRole("link", { name: "Add to Google Calendar" })).toHaveAttribute("href", /calendar\.google\.com.*ctz=Asia%2FKolkata.*BYDAY%3DMO/);
  const [file] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Add to iPhone or Outlook/ }).click()]);
  expect(file.suggestedFilename()).toBe("xplaind-weekly-plan.ics");
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("the resume review explains when AI is off, and its API refuses (RV-1)", async ({ page, request }) => {
  await page.goto("/ai/resume");
  await expect(page.getByRole("heading", { level: 1, name: "Get your resume shortlisted" })).toBeVisible();
  await expect(page.getByText("AI features are not switched on yet")).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
  const res = await request.post("/api/ai/resume", { data: { resume: "Asha Rao, Python developer. ".repeat(20), role: "AI Engineer" } });
  expect(res.status()).toBe(503);
  expect((await request.post("/api/ai/resume", { data: { resume: "short" } })).status()).toBe(400);
});

test("the Practice page points to the AI glossary (PR-9)", async ({ page }) => {
  await page.goto("/practice");
  await expect(page.getByRole("heading", { name: "AI glossary" })).toBeVisible();
  await expect(page.getByRole("link", { name: "AI glossary", exact: true })).toHaveAttribute("href", "/glossary");
  await expect(page.getByRole("link", { name: "Open the AI glossary →" })).toHaveAttribute("href", "/glossary");
});
