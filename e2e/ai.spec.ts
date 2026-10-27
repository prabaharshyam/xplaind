import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcag = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test.use({ viewport: { width: 360, height: 740 } });

// A roadmap as the generator saves it, so the viewer and editor can be tested without calling the model.
const saved = {
  version: 1,
  courses: [],
  roadmaps: [
    {
      id: "r1",
      createdOn: "2026-10-26",
      goal: "Build RAG apps",
      done: [],
      roadmap: {
        title: "From zero to RAG engineer",
        summary: "Twelve weeks from Python basics to a deployed retrieval app.",
        stages: [
          {
            id: "s1",
            title: "Foundations",
            weeks: 4,
            goal: "Write small Python programs",
            topics: [
              { id: "s1t1", title: "Python basics", why: "Everything else uses it", subtopics: ["variables", "functions"], hours: 10, lessonId: "python-basics" },
              { id: "s1t2", title: "How language models work", why: "Know the tool", subtopics: ["tokens"], hours: 4, lessonId: null },
            ],
          },
          { id: "s2", title: "Retrieval", weeks: 8, goal: "Ship a RAG app", topics: [{ id: "s2t1", title: "Vector search", why: "Find the right text", subtopics: [], hours: 8, lessonId: null }] },
        ],
        project: { title: "A policy bot", description: "Answers HR questions from a PDF." },
        tips: ["Study at the same time each day."],
      },
    },
  ],
};

test("the AI tools page lists every tool and says when AI is off", async ({ page }) => {
  await page.goto("/ai");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  for (const name of ["AI roadmap generator", "Generate a course on anything", "Personal AI coach", "AI tutor in every lesson", "AI interview feedback", "Change your roadmap with AI"]) {
    await expect(page.getByRole("link", { name: new RegExp(name) })).toBeVisible();
  }
  await expect(page.getByText(/AI tools are switched off right now/)).toBeVisible();
  expect(await overflow(page)).toBe(false);
});

test("without a key the generator explains that AI is not on, and the API refuses", async ({ page, request }) => {
  await page.goto("/ai/roadmap");
  await expect(page.getByText("AI features are not switched on yet")).toBeVisible();
  expect((await wcag(page)).violations).toEqual([]);
  const res = await request.post("/api/ai/roadmap", { data: { mode: "new", goal: "Learn RAG", background: "", level: "new", hoursPerWeek: 5, weeks: 8 } });
  expect(res.status()).toBe(503);
  const bad = await request.post("/api/ai/roadmap", { data: { mode: "new", goal: "x" } });
  expect(bad.status()).toBe(400);
});

test("a saved roadmap opens, can be ticked off and edited by hand", async ({ page }) => {
  await page.goto("/ai/roadmap");
  await page.evaluate((v) => localStorage.setItem("xplaind.ai.v1", JSON.stringify(v)), saved);
  await page.reload();
  await page.getByRole("button", { name: /From zero to RAG engineer/ }).click();
  await expect(page.getByRole("heading", { level: 2, name: "From zero to RAG engineer" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Read our lesson" })).toHaveAttribute("href", "/stop/python-basics");
  expect((await wcag(page)).violations).toEqual([]);
  expect(await overflow(page)).toBe(false);

  await page.getByRole("checkbox", { name: 'Mark "Python basics" done' }).check();
  await expect(page.getByText("33% done").first()).toBeVisible();

  await page.getByRole("button", { name: "Edit roadmap" }).click();
  await page.getByRole("button", { name: "Move up: How language models work" }).click();
  const titles = await page.getByRole("textbox", { name: "Topic name" }).evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
  expect(titles.slice(0, 2)).toEqual(["How language models work", "Python basics"]);
  await page.getByRole("button", { name: "Remove: Vector search" }).click();
  await expect(page.getByRole("heading", { name: /Retrieval/ })).toHaveCount(0);
  await page.getByRole("textbox", { name: "New topic for Foundations" }).fill("Git and GitHub");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Topic name" }).last()).toHaveValue("Git and GitHub");

  // the edit survives a reload, and the AI editor asks for AI to be switched on
  await page.reload();
  await page.getByRole("button", { name: /From zero to RAG engineer/ }).click();
  await expect(page.getByText("Git and GitHub")).toBeVisible();
  await expect(page.getByText("AI features are not switched on yet")).toBeVisible();
});

test("every lesson ends with the AI tutor section", async ({ page }) => {
  await page.goto("/stop/what-is-ai");
  const tutor = page.getByRole("region", { name: /Ask the AI tutor/ });
  await expect(tutor).toBeVisible();
  await expect(tutor.getByText("AI features are not switched on yet")).toBeVisible();
});

test("the course generator and coach pages work without AI", async ({ page }) => {
  for (const path of ["/ai/course", "/ai/coach"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("AI features are not switched on yet")).toBeVisible();
    expect(await overflow(page)).toBe(false);
  }
  await expect(page.getByText("What your coach sees")).toBeVisible();
});
