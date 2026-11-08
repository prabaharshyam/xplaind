import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcag = (page: import("@playwright/test").Page) => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test("the interview hub leads to patterns, and a pattern explains itself with a diagram (IP-1, IP-3)", async ({ page }) => {
  await page.goto("/interview");
  await page.getByRole("link", { name: /^Interview patterns/ }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "AI interview patterns" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Retrieval and RAG" })).toBeVisible();
  await page.getByRole("link", { name: /^Hybrid search \+ rerank/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Hybrid search + rerank" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Say it in the interview" })).toBeVisible();
  await expect(page.locator("figure:has(svg)")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /hybrid search/i }).first()).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("a system design answer walks through the 35-minute shape (IP-2)", async ({ page }) => {
  await page.goto("/interview/design");
  await page.getByRole("link", { name: /customer support assistant for an Indian bank/ }).click();
  for (const h of ["Clarify", "Requirements and numbers", "High-level design", "Deep dives", "Failures", "Evals and monitoring", "Trade-offs"]) {
    await expect(page.getByRole("heading", { level: 2, name: new RegExp(h) })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "RAG pipeline" })).toHaveAttribute("href", "/interview/patterns/rag-pipeline");
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("the software engineering and Git track lists its lessons (SE-1)", async ({ page }) => {
  await page.goto("/topics/software-engineering");
  await expect(page.getByRole("heading", { level: 1, name: "Software engineering" })).toBeVisible();
  for (const name of ["Git branches, merging and rebasing", "Writing tests with pytest", "Debugging systematically", "Code review: giving and getting good reviews"]) {
    await expect(page.getByRole("link", { name: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).first()).toBeVisible();
  }
});

test("the three book-informed lessons render with their sections, a diagram and code (LQ-1)", async ({ page }) => {
  const lessons: [string, RegExp, string][] = [
    ["how-models-pick-words", /How a model picks its next word/, "From the playground to production"],
    ["how-fine-tuning-works", /How fine-tuning works/, "When fine-tuning is the wrong tool"],
    ["lora-and-memory-maths", /LoRA, QLoRA and the GPU memory maths/, "When not to use LoRA or QLoRA"],
  ];
  for (const [id, title, extra] of lessons) {
    await page.goto(`/stop/${id}`);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: extra })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Common mistakes" })).toBeVisible();
    await expect(page.locator("figure:has(svg)").first()).toBeVisible();
    await expect(page.locator("pre").first()).toBeVisible();
    expect(await overflow(page)).toBe(false);
    expect((await wcag(page)).violations).toEqual([]);
  }
});

test("the second batch of book-informed lessons render with their sections, a diagram and code (LQ-2)", async ({ page }) => {
  const lessons: [string, RegExp, string][] = [
    ["how-chat-models-are-made", /How a chat model is made/, "Why chat models behave the way they do"],
    ["choosing-a-model", /Choosing a model/, "When benchmarks do help"],
    ["synthetic-data-distillation", /Synthetic data and distillation/, "The limits of model-made data"],
  ];
  for (const [id, title, extra] of lessons) {
    await page.goto(`/stop/${id}`);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: extra })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Common mistakes" })).toBeVisible();
    await expect(page.locator("figure:has(svg)").first()).toBeVisible();
    await expect(page.locator("pre").first()).toBeVisible();
    expect(await overflow(page)).toBe(false);
    expect((await wcag(page)).violations).toEqual([]);
  }
});

test("the third batch of book-informed lessons render with their sections, a diagram and code (LQ-3)", async ({ page }) => {
  const lessons: [string, RegExp, string][] = [
    ["reasoning-models", /Reasoning models and test-time compute/, "When more thinking is the wrong tool"],
    ["how-llm-inference-works", /Inside LLM inference/, "Which lever to pull first"],
    ["building-training-data", /Building a training dataset/, "When you do not need a training dataset"],
  ];
  for (const [id, title, extra] of lessons) {
    await page.goto(`/stop/${id}`);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: extra })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Common mistakes" })).toBeVisible();
    await expect(page.locator("figure:has(svg)").first()).toBeVisible();
    await expect(page.locator("pre").first()).toBeVisible();
    expect(await overflow(page)).toBe(false);
    expect((await wcag(page)).violations).toEqual([]);
  }
});

test("the fourth batch of book-informed lessons render with their sections, a diagram and code (LQ-4)", async ({ page }) => {
  const lessons: [string, RegExp, string][] = [
    ["scoring-open-ended-answers", /Scoring open-ended answers/, "When to keep it simple"],
    ["ai-app-in-layers", /Grow an AI app in layers/, "When to stay simple"],
    ["catching-hallucinations", /Catching hallucinations/, "When detection is not enough"],
  ];
  for (const [id, title, extra] of lessons) {
    await page.goto(`/stop/${id}`);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: extra })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Common mistakes" })).toBeVisible();
    await expect(page.locator("figure:has(svg)").first()).toBeVisible();
    await expect(page.locator("pre").first()).toBeVisible();
    expect(await overflow(page)).toBe(false);
    expect((await wcag(page)).violations).toEqual([]);
  }
});

test("the fifth batch of book-informed lessons render with their sections, a diagram and code (LQ-5)", async ({ page }) => {
  const lessons: [string, RegExp, string][] = [
    ["ai-in-indian-languages", /AI in Indian languages/, "When English is fine"],
    ["model-size-and-scaling", /Model size and scaling laws/, "When bigger is not better"],
    ["perplexity-and-cross-entropy", /Perplexity and cross-entropy/, "When you do not need these metrics"],
  ];
  for (const [id, title, extra] of lessons) {
    await page.goto(`/stop/${id}`);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: extra })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Common mistakes" })).toBeVisible();
    await expect(page.locator("figure:has(svg)").first()).toBeVisible();
    await expect(page.locator("pre").first()).toBeVisible();
    expect(await overflow(page)).toBe(false);
    expect((await wcag(page)).violations).toEqual([]);
  }
});
