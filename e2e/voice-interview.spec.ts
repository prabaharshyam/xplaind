import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// VI-1 to VI-5: the AI voice interviewer (Pro). The AI routes are mocked, as in the MB-12 tests: CI has no AI key.

const wcag = (page: Page) => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test.use({ viewport: { width: 360, height: 740 } });

const FOLLOW_UP = "You mentioned chunks. How would you choose the chunk size, and why?";

const report = {
  report: {
    score: 72,
    answered: 1,
    summary: "You know the core idea and explain it clearly.",
    questions: [
      {
        questionId: "what-is-rag",
        question: "What is RAG (retrieval-augmented generation)?",
        answered: true,
        followUps: 1,
        points: [
          { point: "Retrieves relevant text from your documents", covered: true, evidence: "we retrieve relevant chunks" },
          { point: "Adds it to the prompt", covered: false, evidence: "" },
        ],
        coverage: 50,
        depth: 3,
        depthNote: "Correct, but no trade-offs.",
        modelAnswer: "RAG retrieves the passages most relevant to a question and adds them to the prompt.",
      },
    ],
    communication: { score: 70, structure: 4, clarity: 3, note: "A clear opening line.", fillers: { total: 1, perMinute: 1, top: [{ word: "basically", count: 1 }] }, words: 40, wordsPerMinute: 120 },
    improvements: ["Name a trade-off.", "Give a real example.", "Close with how you would measure it."],
  },
  readiness: { score: 72, change: null, sessions: 1 },
  pathId: "any",
};

/** Records what is read aloud, so the test can check the questions are spoken (and nothing needs a real voice). */
const fakeSpeechOut = () => {
  const spoken: string[] = [];
  (window as unknown as { __spoken: string[] }).__spoken = spoken;
  class Utterance {
    text: string;
    lang = "";
    rate = 1;
    voice: unknown = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(text: string) {
      this.text = text;
    }
  }
  Object.defineProperty(window, "SpeechSynthesisUtterance", { value: Utterance, configurable: true });
  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: {
      speak: (u: Utterance) => {
        spoken.push(u.text);
        setTimeout(() => u.onend?.(), 10);
      },
      cancel: () => undefined,
      getVoices: () => [
        { lang: "en-US", localService: true, name: "US" },
        { lang: "en-IN", localService: true, name: "India" },
      ],
    },
  });
};

test("the AI interviewer asks consent, follows up on the answer, and ends with a scored report (VI-1, VI-2, VI-4)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(fakeSpeechOut);
  const sent: { url: string; body: unknown }[] = [];
  await page.route("**/api/ai/voice", (route) => {
    sent.push({ url: "check", body: null });
    return route.fulfill({ json: { ok: true } });
  });
  let turns = 0;
  await page.route("**/api/ai/voice/turn", async (route) => {
    const body = route.request().postDataJSON() as { questionId: string; exchanges: { asked: string; answer: string }[] };
    sent.push({ url: "turn", body });
    turns++;
    await new Promise((r) => setTimeout(r, 300)); // long enough to see the "thinking" state
    await route.fulfill({ json: { follow_up: turns === 1 ? FOLLOW_UP : null } });
  });
  await page.route("**/api/ai/voice/report", async (route) => {
    sent.push({ url: "report", body: route.request().postDataJSON() });
    await route.fulfill({ json: report });
  });

  await page.goto("/interview/simulator?question=what-is-rag");
  await expect(page.getByRole("heading", { name: /AI interviewer/ })).toBeVisible();
  await page.getByRole("button", { name: "Start the AI interviewer" }).click();

  // VI-2: a consent notice before the first turn, and nothing is sent until the learner agrees.
  await expect(page.getByRole("heading", { level: 2, name: "Before you start" })).toBeVisible();
  await expect(page.getByText(/Only that text \(the transcript\) is sent to our AI/)).toBeVisible();
  await expect(page.getByText(/Your voice is never uploaded to Xplaind or stored/)).toBeVisible();
  expect(sent).toEqual([]);
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
  await page.getByRole("button", { name: "I agree, start the interview" }).click();

  // The question is read aloud and shown; headless Chromium has no speech-to-text, so the learner types.
  const question = page.getByRole("heading", { level: 2, name: /What is RAG/ });
  await expect(question).toBeFocused();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken)).toContainEqual(expect.stringMatching(/What is RAG/));
  expect((await wcag(page)).violations).toEqual([]);
  await page.getByLabel("Your answer").fill("Basically we retrieve relevant chunks from documents and add them to the prompt.");
  await page.getByRole("button", { name: "Submit answer" }).click();

  // While waiting, the pulse respects reduced motion.
  const thinking = page.getByRole("status").filter({ hasText: "thinking of a follow-up" });
  await expect(thinking).toBeVisible();
  expect(await thinking.locator("span").first().evaluate((el) => getComputedStyle(el).animationName)).toBe("none");

  // A follow-up about what the learner said, read aloud too.
  await expect(page.getByRole("heading", { level: 2, name: FOLLOW_UP })).toBeVisible();
  await expect(page.getByText("Follow-up 1 of up to 2")).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken)).toContain(FOLLOW_UP);
  await page.getByLabel("Your answer").fill("Small enough to stay on one idea, around 300 tokens, and I would test it.");
  await page.getByRole("button", { name: "Submit answer" }).click();

  // The report.
  await expect(page.getByRole("heading", { name: "Your AI interview report" })).toBeFocused();
  await expect(page.getByRole("meter", { name: "Interview score" })).toHaveAttribute("aria-valuenow", "72");
  await expect(page.getByRole("heading", { name: "Three things to improve" })).toBeVisible();
  await expect(page.getByText("You said: “we retrieve relevant chunks”")).toBeVisible();
  await expect(page.locator("p", { hasText: "Filler words:" })).toContainText("“basically” 1");
  await expect(page.getByText(/We saved only your score/)).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);

  // Only text went to the server: the transcript of each turn, in order, and never audio.
  const turnBodies = sent.filter((s) => s.url === "turn").map((s) => s.body as { exchanges: { answer: string }[] });
  expect(turnBodies.map((b) => b.exchanges.length)).toEqual([1, 2]);
  const reportBody = sent.find((s) => s.url === "report")?.body as { items: { questionId: string; exchanges: { asked: string }[] }[] };
  expect(reportBody.items).toHaveLength(1);
  expect(reportBody.items[0].exchanges.map((e) => e.asked)).toEqual([expect.stringMatching(/What is RAG/), FOLLOW_UP]);
  expect(JSON.stringify(sent)).not.toMatch(/audio|blob|base64/i);
});

test("a learner without Pro is told before answering anything (VI-3)", async ({ page }) => {
  let turns = 0;
  await page.route("**/api/ai/voice", (route) =>
    route.fulfill({ status: 403, json: { error: "The AI voice interviewer is part of Pro.", upgrade: "/pricing" } }),
  );
  await page.route("**/api/ai/voice/turn", (route) => {
    turns++;
    return route.fulfill({ json: { follow_up: null } });
  });
  await page.goto("/interview/simulator?question=what-is-rag");
  await page.getByRole("button", { name: "Start the AI interviewer" }).click();
  await page.getByRole("button", { name: "I agree, start the interview" }).click();
  const alert = page.getByRole("alert").filter({ hasText: "part of Pro" });
  await expect(alert).toBeVisible();
  await expect(alert.getByRole("link", { name: "See Pro" })).toHaveAttribute("href", "/pricing");
  await expect(page.getByLabel("Your answer")).toHaveCount(0);
  expect(turns).toBe(0);
  await page.getByRole("button", { name: "Back to the mock interview" }).click();
  await expect(page.getByRole("button", { name: "Start the AI interviewer" })).toBeVisible();
});

test("when the microphone is blocked, the learner is told plainly and can type instead (VI-5)", async ({ page }) => {
  await page.addInitScript(() => {
    class BlockedRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      onresult: unknown = null;
      onerror: ((e: { error: string }) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        setTimeout(() => {
          this.onerror?.({ error: "not-allowed" });
          this.onend?.();
        }, 20);
      }
      stop() {}
      abort() {}
    }
    for (const name of ["SpeechRecognition", "webkitSpeechRecognition"]) {
      Object.defineProperty(window, name, { value: BlockedRecognition, configurable: true, writable: true });
    }
  });
  await page.route("**/api/ai/voice", (route) => route.fulfill({ json: { ok: true } }));
  await page.goto("/interview/simulator?question=what-is-rag");
  await page.getByRole("button", { name: "Start the AI interviewer" }).click();
  await page.getByRole("button", { name: "I agree, start the interview" }).click();
  await page.getByRole("button", { name: "Start speaking" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "The microphone is blocked" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start speaking" })).toHaveCount(0); // now typing only
  await page.getByLabel("Your answer").fill("I can still answer by typing.");
  await expect(page.getByLabel("Your answer")).toHaveValue("I can still answer by typing.");
  expect((await wcag(page)).violations).toEqual([]);
});
