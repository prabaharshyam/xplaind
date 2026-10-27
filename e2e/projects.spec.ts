import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcag = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test.use({ viewport: { width: 360, height: 740 } });

test("the projects index lists every guided project and filters by role and difficulty (GP-3)", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { level: 1, name: "Guided projects" })).toBeVisible();
  await expect(page.getByText("23 projects")).toBeVisible();
  await page.getByLabel("Role").selectOption("forward-deployed-engineer");
  await expect(page.getByText("6 projects")).toBeVisible();
  await page.getByLabel("Difficulty").selectOption("intermediate");
  await expect(page.getByText("1 project", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /A document question-answering API/ })).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("a guided project's steps, rubric and submission are kept and show on the roadmap (GP-2, GP-4)", async ({ page }) => {
  await page.goto("/projects/document-qa-api");
  await expect(page.getByRole("heading", { level: 1, name: "A document question-answering API" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Forward Deployed Engineer (FDE): Engineering foundations" })).toHaveAttribute("href", "/roadmap/forward-deployed-engineer#projects");
  await page.getByText("Show a hint").first().click();
  await page.getByLabel("I have done this step").nth(0).check();
  await page.getByLabel("I have done this step").nth(1).check();
  await expect(page.getByText("2 of 6 done")).toBeVisible();
  await page.getByLabel("My project meets this").first().check();
  await expect(page.getByText(/You meet 1 of 5 criteria/)).toBeVisible();
  await page.getByLabel(/Link to your project/).fill("nope");
  await page.getByRole("button", { name: "Mark project done" }).click();
  await expect(page.locator("#submit-error")).toContainText("Paste a full web link");
  await page.getByLabel(/Link to your project/).fill("https://github.com/learner/doc-qa");
  await page.getByRole("button", { name: "Mark project done" }).click();
  await expect(page.getByText("Project done. Your link:")).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);

  // kept after a reload, and the roadmap's Projects tab agrees
  await page.reload();
  await expect(page.getByText("2 of 6 done")).toBeVisible();
  await page.goto("/roadmap/forward-deployed-engineer#projects");
  await expect(page.getByText("1 of 6 projects done.")).toBeVisible();
  await expect(page.getByRole("link", { name: /Open the step-by-step guide/ }).first()).toHaveAttribute("href", "/projects/document-qa-api");
});
