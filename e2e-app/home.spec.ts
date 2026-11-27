import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./signed-in";

test("the app Home: a greeting, Ask anything into the tutor, and the main things to do (APP-3)", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1, name: /^(Good (morning|afternoon|evening)|Welcome back)$/ })).toBeVisible();
  const actions = page.getByRole("region", { name: "What would you like to do?" }).getByRole("link");
  await expect(actions).toHaveCount(8);
  for (const [name, href] of [
    [/Mock interview/, "/interview/simulator"],
    [/Review my resume/, "/ai/resume"],
    [/Study from my notes/, "/ai/book"],
    [/Flashcards/, "/practice"],
    [/Plan my week/, "/plan"],
  ] as const) {
    await expect(actions.filter({ hasText: name })).toHaveAttribute("href", href);
  }
  // Owner (2026-11-27): no Download my roadmap card here; the roadmap page has its own.
  await expect(actions.filter({ hasText: /Download my roadmap/ })).toHaveCount(0);
  await expect(actions.filter({ hasText: /Code playground/ })).toHaveAttribute("href", "/playground");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations).toEqual([]);

  // The question is typed into the tutor, not sent: the learner sends it.
  await page.getByRole("textbox", { name: "Ask anything about AI" }).fill("What is RAG?");
  await page.getByRole("button", { name: "Ask the AI tutor" }).click();
  await expect(page).toHaveURL(/\/ai\/tutor\?q=What\+is\+RAG%3F$/);
  // The test build has a dummy AI key (nothing is sent), so the chat is there, with the question typed in.
  await expect(page.getByRole("textbox", { name: /Ask your AI tutor|Your question|Message/ }).or(page.locator("textarea")).first()).toHaveValue("What is RAG?");
});
