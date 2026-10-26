import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const wcag = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();

test.use({ viewport: { width: 360, height: 740 } });

test("a typed mock interview ends with a report on key points", async ({ page }) => {
  await page.goto("/interview/simulator?path=rag-expert");
  await expect(page.getByRole("heading", { level: 1, name: "Mock interview" })).toBeVisible();
  await expect(page.getByLabel("Role")).toHaveValue("rag-expert");
  expect((await wcag(page)).violations).toEqual([]);
  await page.getByRole("radio", { name: "3" }).check();
  // Headless Chromium has no speech service, so start in typing mode.
  await page.getByRole("button", { name: /Type my answers instead|Start, typing my answers/ }).click();

  for (let i = 1; i <= 3; i++) {
    await expect(page.getByText(`Question ${i} of 3`)).toBeVisible();
    if (i === 1) expect((await wcag(page)).violations).toEqual([]);
    const answer = page.getByLabel(/Your answer/);
    if (i === 3) {
      await page.getByRole("button", { name: "Skip this question" }).click();
    } else {
      await answer.fill("We retrieve relevant chunks with hybrid search, ground the answer in that context, cite the source and measure recall on a test set.");
      await answer.press("Enter");
    }
  }

  await expect(page.getByRole("heading", { name: "Your interview report" })).toBeFocused();
  await expect(page.getByText("Answered", { exact: true }).locator("..")).toContainText("2 of 3");
  await expect(page.getByRole("heading", { name: "Fix these first" })).toBeVisible();
  // the analysis: overall and per-concept understanding, evidence from the answer, closeness and structure
  await expect(page.getByRole("meter", { name: "Overall understanding" })).not.toHaveAttribute("aria-valuenow", "0");
  await expect(page.getByRole("heading", { name: "Concept by concept" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What you covered" }).first()).toBeVisible();
  await expect(page.getByText(/^You said: “/).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Compared with the model answer: \d+% of its key terms$/ }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "How you built the answer" }).first()).toBeVisible();
  await expect(page.getByText("Not answered").first()).toBeVisible(); // the skipped question
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("a single question can be practised from its page", async ({ page }) => {
  await page.goto("/interview/what-is-rag");
  await expect(page.getByRole("heading", { name: "What a strong answer covers" })).toBeVisible();
  await page.getByRole("link", { name: "Answer it out loud in the mock interview" }).click();
  await expect(page.locator("p", { hasText: "One question:" })).toContainText("What is RAG");
});

test("each role has its own interview page", async ({ page }) => {
  await page.goto("/interview/for/forward-deployed-engineer");
  await expect(page.getByRole("heading", { level: 1, name: "Forward Deployed Engineer interview questions" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Start a Forward Deployed Engineer mock interview/ })).toHaveAttribute(
    "href",
    "/interview/simulator?path=forward-deployed-engineer",
  );
  expect(await page.locator('script[type="application/ld+json"]').count()).toBe(1);
  expect((await wcag(page)).violations).toEqual([]);
});

test("Space turns a (fake) microphone on and off and the words land in the answer", async ({ page }) => {
  // A stand-in for the browser's speech service: says one sentence each time it starts.
  await page.addInitScript(() => {
    class FakeRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      onresult: ((e: unknown) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      private live = false;
      start() {
        this.live = true;
        setTimeout(() => {
          if (!this.live) return;
          const result = Object.assign([{ transcript: "We retrieve relevant chunks and cite the source" }], { isFinal: true });
          this.onresult?.({ resultIndex: 0, results: [result] });
        }, 100);
      }
      stop() {
        this.live = false;
        setTimeout(() => this.onend?.(), 10);
      }
      abort() {
        this.stop();
      }
    }
    for (const name of ["SpeechRecognition", "webkitSpeechRecognition"]) {
      Object.defineProperty(window, name, { value: FakeRecognition, configurable: true, writable: true });
    }
  });
  await page.goto("/interview/simulator?question=what-is-rag");
  await page.getByRole("button", { name: "Allow the microphone and start" }).click();
  const mic = page.getByRole("button", { name: /Start speaking/ });
  await expect(mic).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: /Stop the microphone/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel(/Your answer/)).toHaveValue(/retrieve relevant chunks/);
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: /Speak more/ })).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Your interview report" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Retrieves relevant text from your documents" }).filter({ hasText: "You said:" })).toBeVisible();
});
