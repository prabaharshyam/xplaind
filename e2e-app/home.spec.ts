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
  await expect(actions.filter({ hasText: /Download my roadmap/ })).toHaveAttribute("href", /^\/roadmap\/[a-z-]+#download$/);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations).toEqual([]);

  // The question is typed into the tutor, not sent: the learner sends it.
  await page.getByRole("textbox", { name: "Ask anything about AI" }).fill("What is RAG?");
  await page.getByRole("button", { name: "Ask the AI tutor" }).click();
  await expect(page).toHaveURL(/\/ai\/tutor\?q=What\+is\+RAG%3F$/);
  // The test build has no AI key, so the tutor shows its "AI is off" notice instead of the chat box; where the chat
  // is on, AiChat starts with this question in its box (initialDraft).
});
