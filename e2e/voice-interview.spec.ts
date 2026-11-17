import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// VI-1 to VI-7: the AI voice interviewer (Pro), hands-free. The AI and voice routes are mocked, as in the
// MB-12 tests: CI has no AI or voice key. A fake microphone "says" an answer, then goes quiet.

const wcag = (page: Page) => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test.use({ viewport: { width: 360, height: 740 } });

const OPENING = "Hi, I'm your AI interviewer for today. Let's begin. What is RAG (retrieval-augmented generation)?";
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

/** Records what is read aloud by the browser's own voice (the fallback when our voice service sends no audio). */
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
        setTimeout(() => u.onend?.(), 50);
      },
      cancel: () => undefined,
      getVoices: () => [{ lang: "en-IN", localService: true, name: "India" }],
    },
  });
};

/** A microphone that hears one answer per start, then silence: the next answer each time it is opened. */
const fakeMicrophone = (answers: string[]) => {
  let n = 0;
  class Mic {
    lang = "";
    continuous = false;
    interimResults = false;
    onresult: ((e: unknown) => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    onend: (() => void) | null = null;
    onaudiostart: (() => void) | null = null;
    private live = false;
    start() {
      this.live = true;
      const said = answers[Math.min(n++, answers.length - 1)];
      setTimeout(() => this.onaudiostart?.(), 20);
      setTimeout(() => {
        if (!this.live) return;
        const result = Object.assign([{ transcript: said }], { isFinal: true });
        this.onresult?.({ resultIndex: 0, results: [result] });
      }, 200);
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
    Object.defineProperty(window, name, { value: Mic, configurable: true, writable: true });
  }
};

/** The voice route without a voice key: no audio, just the line for the browser to read (status 204). */
const speakRoute = (page: Page, lines: string[]) =>
  page.route("**/api/ai/voice/speak", async (route) => {
    const body = route.request().postDataJSON() as { line: string };
    lines.push(body.line);
    await route.fulfill({ status: 204, headers: { "x-say": encodeURIComponent(body.line === "closing" ? "That's the end of the interview." : OPENING) } });
  });

test("a hands-free conversation: the interviewer speaks, listens, sends on a pause, follows up and reports (VI-1, VI-2, VI-4, VI-7)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(fakeSpeechOut);
  await page.addInitScript(fakeMicrophone, [
    "Basically we retrieve relevant chunks from documents and add them to the prompt.",
    "Small enough to stay on one idea, around 300 tokens, and I would test it.",
  ]);
  const sent: { url: string; body: unknown }[] = [];
  const spokenLines: string[] = [];
  await page.route("**/api/ai/voice", (route) => {
    sent.push({ url: "check", body: null });
    return route.fulfill({ json: { ok: true } });
  });
  await speakRoute(page, spokenLines);
  let turns = 0;
  await page.route("**/api/ai/voice/turn", async (route) => {
    sent.push({ url: "turn", body: route.request().postDataJSON() });
    turns++;
    await new Promise((r) => setTimeout(r, 300)); // long enough to see the "thinking" state
    await route.fulfill({ json: turns === 1 ? { follow_up: FOLLOW_UP, say: `Okay, got it. ${FOLLOW_UP}`, audio: null } : { follow_up: null } });
  });
  await page.route("**/api/ai/voice/report", async (route) => {
    sent.push({ url: "report", body: route.request().postDataJSON() });
    await route.fulfill({ json: report });
  });

  await page.goto("/interview/simulator?question=what-is-rag");
  await page.getByRole("button", { name: "Start the AI interviewer" }).click();

  // VI-2: a consent notice before anything is sent.
  await expect(page.getByRole("heading", { level: 2, name: "Before you start" })).toBeVisible();
  await expect(page.getByText(/Only that text \(the transcript\) is sent to our AI/)).toBeVisible();
  await expect(page.getByText(/voice is made by Sarvam AI/)).toBeVisible();
  expect(sent).toEqual([]);
  expect((await wcag(page)).violations).toEqual([]);
  await page.getByRole("button", { name: "I agree, start the interview" }).click();

  // The interviewer speaks the opening line (here with the browser's voice, since the mock sends no audio).
  const conversation = page.getByRole("region", { name: "Conversation" });
  await expect(conversation.getByRole("listitem").first()).toContainText("Hi, I'm your AI interviewer");
  await expect.poll(() => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken)).toContainEqual(expect.stringMatching(/Hi, I'm your AI interviewer/));
  expect(spokenLines).toContain("question");

  // Hands-free: the microphone opens by itself, the words show as a caption, and a pause sends them. No taps.
  await expect(page.getByText("Basically we retrieve relevant chunks", { exact: false }).first()).toBeVisible();
  expect((await wcag(page)).violations).toEqual([]);
  expect(await overflow(page)).toBe(false);
  await expect(page.getByRole("status").filter({ hasText: "Thinking" })).toBeVisible({ timeout: 6000 });
  // Reduced motion: the thinking ring does not spin.
  expect(await page.locator(".motion-safe\\:animate-spin").first().evaluate((el) => getComputedStyle(el).animationName)).toBe("none");

  // A follow-up about what was said, with a short natural reaction first.
  await expect(conversation.getByText(`Okay, got it. ${FOLLOW_UP}`)).toBeVisible();
  await expect(page.getByText("Question 1 of 1 · follow-up 1")).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken)).toContain(`Okay, got it. ${FOLLOW_UP}`);

  // The second answer is also sent on a pause, then the report.
  await expect(page.getByRole("heading", { name: "Your AI interview report" })).toBeFocused({ timeout: 10_000 });
  await expect(page.getByRole("meter", { name: "Interview score" })).toHaveAttribute("aria-valuenow", "72");
  await expect(page.getByText("You said: “we retrieve relevant chunks”")).toBeVisible();
  expect(spokenLines).toContain("closing");
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);

  // Only text went to the server: each answer, in order, with the interviewer's follow-up. Never audio.
  const turnBodies = sent.filter((s) => s.url === "turn").map((s) => s.body as { exchanges: { asked: string; answer: string }[] });
  expect(turnBodies.map((b) => b.exchanges.length)).toEqual([1, 2]);
  expect(turnBodies[1].exchanges[1]).toMatchObject({ asked: FOLLOW_UP, answer: expect.stringMatching(/300 tokens/) });
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
  expect(turns).toBe(0);
  await page.getByRole("button", { name: "Back to the mock interview" }).click();
  await expect(page.getByRole("button", { name: "Start the AI interviewer" })).toBeVisible();
});

test("when the microphone is blocked, the learner is told plainly and can type instead (VI-5)", async ({ page }) => {
  await page.addInitScript(fakeSpeechOut);
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
  const turns: unknown[] = [];
  await page.route("**/api/ai/voice", (route) => route.fulfill({ json: { ok: true } }));
  await speakRoute(page, []);
  await page.route("**/api/ai/voice/turn", (route) => {
    turns.push(route.request().postDataJSON());
    return route.fulfill({ json: { follow_up: null } });
  });
  await page.route("**/api/ai/voice/report", (route) => route.fulfill({ json: report }));
  await page.goto("/interview/simulator?question=what-is-rag");
  await page.getByRole("button", { name: "Start the AI interviewer" }).click();
  await page.getByRole("button", { name: "I agree, start the interview" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "The microphone is blocked" })).toBeVisible();
  await page.getByLabel("Your answer").fill("I can still answer by typing.");
  expect((await wcag(page)).violations).toEqual([]);
  await page.getByRole("button", { name: "Send answer" }).click();
  await expect.poll(() => turns.length).toBe(1);
  await expect(page.getByRole("heading", { name: "Your AI interview report" })).toBeVisible();
});
