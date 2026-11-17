import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// VI-1 to VI-7: the AI voice interviewer (Pro), hands-free. The AI and voice routes are mocked, as in the
// MB-12 tests: CI has no AI or voice key. A fake microphone "says" an answer, then goes quiet.

// Checked with reduced motion, so the page's entrance animations (VI-12) are not caught half-faded.
const wcag = async (page: Page) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  return new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
};
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
        score: 3,
        wentWell: ["A clear one-line definition"],
        gaps: ["No trade-off: a strong answer names chunk size against recall"],
        followUpHandling: "You answered the follow-up with a number, which helped.",
        delivery: { words: 40, wordsPerMinute: 120, fillers: 1, hedges: ["I think"] },
      },
    ],
    communication: { score: 70, structure: 4, clarity: 3, note: "A clear opening line.", fillers: { total: 1, perMinute: 1, top: [{ word: "basically", count: 1 }] }, words: 40, wordsPerMinute: 120 },
    improvements: ["Name a trade-off.", "Give a real example.", "Close with how you would measure it."],
    verdict: { key: "hire", label: "Hire", reason: "Solid basics, but thin on trade-offs." },
    competencies: [
      { name: "Retrieval design", score: 3, evidence: ["we retrieve relevant chunks"], note: "Knows the flow." },
      { name: "Communication", score: 4, evidence: [], note: "Clear and short." },
    ],
    strengths: [{ text: "Explains the core idea plainly", evidence: "we retrieve relevant chunks" }],
    risks: [{ text: "May not have built one in production", evidence: "" }],
    plan: [
      { week: 1, focus: "Chunking trade-offs", action: "Build two chunk sizes and compare recall." },
      { week: 2, focus: "Evaluation", action: "Write 20 test questions and score answers." },
    ],
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

/** The start route without a voice key: every line with no audio, so the browser's own voice reads it. */
const startRoute = (page: Page, calls: unknown[] = []) =>
  page.route("**/api/ai/voice/start", async (route) => {
    calls.push(route.request().postDataJSON());
    await route.fulfill({
      json: {
        questions: [{ text: OPENING, audio: null }],
        acks: [{ text: "Okay.", audio: null }, { text: "Mm-hm.", audio: null }],
        closing: { text: "That's the end of the interview.", audio: null },
      },
    });
  });

const spoken = (page: Page) => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken);

test("a call that runs itself (browser speech-to-text): the interviewer speaks, listens, sends on a pause, says okay, follows up and reports (VI-1, VI-2, VI-4, VI-7, VI-8)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(fakeSpeechOut);
  await page.addInitScript(fakeMicrophone, [
    "Basically we retrieve relevant chunks from documents and add them to the prompt.",
    "Small enough to stay on one idea, around 300 tokens, and I would test it.",
  ]);
  const sent: { url: string; body: unknown }[] = [];
  const starts: unknown[] = [];
  await startRoute(page, starts);
  let turns = 0;
  await page.route("**/api/ai/voice/turn", async (route) => {
    sent.push({ url: "turn", body: route.request().postDataJSON() });
    turns++;
    await new Promise((r) => setTimeout(r, 1500)); // long enough to see the "thinking" state
    await route.fulfill({ json: turns === 1 ? { follow_up: FOLLOW_UP, audio: null } : { follow_up: null } });
  });
  await page.route("**/api/ai/voice/report", async (route) => {
    sent.push({ url: "report", body: route.request().postDataJSON() });
    await route.fulfill({ json: report });
  });

  await page.goto("/interview/simulator?question=what-is-rag");
  await page.getByRole("button", { name: "Start the AI interviewer" }).click();

  // VI-2: a consent notice before anything is sent.
  await expect(page.getByRole("heading", { level: 2, name: "Before you start" })).toBeVisible();
  await expect(page.getByText(/Only the text \(the transcript\) goes to our AI/)).toBeVisible();
  await expect(page.getByText(/Xplaind\s+does not keep the recordings/)).toBeVisible();
  expect(starts).toEqual([]);
  expect((await wcag(page)).violations).toEqual([]);
  await page.getByRole("button", { name: "I agree, start the interview" }).click();

  // The call: the interviewer's line is the focal text and is spoken (here by the browser's voice: no audio URL).
  const call = page.getByRole("dialog", { name: "Zarina" });
  await expect(call.getByText(/What is RAG/).first()).toBeVisible(); // the question, large; the full line is in the transcript
  await expect(call.getByRole("heading", { name: "Zarina" })).toBeFocused();
  expect(starts).toEqual([{ questionIds: ["what-is-rag"] }]);
  await expect.poll(() => spoken(page)).toContain(OPENING);

  // Hands-free: the microphone opens by itself, the caption shows the words, and a pause sends them. No taps.
  await expect(call.getByText("Basically we retrieve relevant chunks", { exact: false })).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
  await expect(page.getByRole("status").filter({ hasText: "Zarina is thinking" })).toBeVisible({ timeout: 10_000 });
  // VI-8: an instant "Okay" while the follow-up is written. Reduced motion: the thinking dots stay still.
  await expect.poll(() => spoken(page)).toContain("Okay.");
  expect(await page.locator('[class*="xp-think"]').first().evaluate((el) => getComputedStyle(el).animationName)).toBe("none");

  // A follow-up about what was said.
  await expect(call.getByText(FOLLOW_UP).first()).toBeVisible();
  await expect(call.getByText("Question 1 of 1 · follow-up 1")).toBeVisible();
  await expect.poll(() => spoken(page)).toContain(FOLLOW_UP);

  // The second answer is also sent on a pause, then the report.
  await expect(page.getByRole("heading", { name: "Your AI interview report" })).toBeFocused({ timeout: 20_000 });
  await expect(page.getByRole("meter", { name: "Interview score" })).toHaveAttribute("aria-valuenow", "72");
  await expect(page.getByText("You said: “we retrieve relevant chunks”").first()).toBeVisible();
  // VI-10: a verdict, skills with scores and quotes, strengths and risks, a plan, and per-question detail.
  await expect(page.getByText("Verdict: Hire.")).toBeVisible();
  await expect(page.getByRole("meter", { name: "Retrieval design score" })).toHaveAttribute("aria-valuenow", "3");
  await expect(page.getByRole("heading", { name: "What an interviewer may worry about" })).toBeVisible();
  await expect(page.getByText("Week 1: Chunking trade-offs")).toBeVisible();
  await expect(page.getByText(/No trade-off: a strong answer/)).toBeVisible();
  await expect(page.getByText(/hedging: “I think”/)).toBeVisible();
  await expect.poll(() => spoken(page)).toContain("That's the end of the interview.");
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);

  // Only text went to the server: each answer, in order, with the interviewer's follow-up. Never audio.
  const turnBodies = sent.filter((s) => s.url === "turn").map((s) => s.body as { exchanges: { asked: string; answer: string }[] });
  expect(turnBodies.map((b) => b.exchanges.length)).toEqual([1, 2]);
  expect(turnBodies[1].exchanges[1]).toMatchObject({ asked: FOLLOW_UP, answer: expect.stringMatching(/300 tokens/) });
  expect(JSON.stringify(sent)).not.toMatch(/audio|blob|base64/i);
});

test("trailing off waits longer, warns before sending, and Hold on waits for Done (VI-8)", async ({ page }) => {
  await page.addInitScript(fakeSpeechOut);
  await page.addInitScript(fakeMicrophone, ["We split the documents into chunks and"]);
  await startRoute(page);
  const turns: { exchanges: { answer: string }[] }[] = [];
  await page.route("**/api/ai/voice/turn", (route) => {
    turns.push(route.request().postDataJSON());
    return route.fulfill({ json: { follow_up: null } });
  });
  await page.route("**/api/ai/voice/report", (route) => route.fulfill({ json: report }));
  await page.goto("/interview/simulator?question=what-is-rag");
  await page.getByRole("button", { name: "Start the AI interviewer" }).click();
  await page.getByRole("button", { name: "I agree, start the interview" }).click();
  const hold = page.getByRole("button", { name: "Hold on, I'm not done" });
  await expect(page.getByText("Sending in a moment…")).toBeVisible({ timeout: 10_000 });
  await hold.click();
  await expect(page.getByText("Take your time. Tap Done when you finish.")).toBeVisible();
  await page.waitForTimeout(4000);
  expect(turns).toEqual([]); // held: nothing was sent
  await page.getByRole("button", { name: "Done" }).click();
  await expect.poll(() => turns.length).toBe(1);
  expect(turns[0].exchanges[0].answer).toMatch(/chunks and$/);
});

test("a learner without Pro is told before answering anything (VI-3)", async ({ page }) => {
  let turns = 0;
  await page.route("**/api/ai/voice/start", (route) =>
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
  await startRoute(page);
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

/**
 * A microphone, recorder and audio graph for the Sarvam path (VI-9): each time the microphone is unmuted,
 * it is loud ("speech") from 0.5 s to 2.5 s, then quiet. The recorder hands over a small fake clip.
 */
const fakeRecordingMic = () => {
  const w = window as unknown as Record<string, unknown> & { __mic: { enabled: boolean; on: number } };
  const mic = { enabled: false, on: 0 };
  w.__mic = mic;
  const track = {
    get enabled() {
      return mic.enabled;
    },
    set enabled(v: boolean) {
      if (v && !mic.enabled) mic.on = Date.now();
      mic.enabled = v;
    },
    stop() {},
  };
  const stream = { getAudioTracks: () => [track], getTracks: () => [track] };
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => stream } });
  class Ctx {
    createAnalyser() {
      return {
        fftSize: 1024,
        getFloatTimeDomainData(buf: Float32Array) {
          const t = Date.now() - mic.on;
          const level = mic.enabled && t > 500 && t < 2500 ? 0.2 : 0.002;
          buf.fill(level);
        },
      };
    }
    createMediaStreamSource() {
      return { connect() {} };
    }
    resume() {
      return Promise.resolve();
    }
    close() {
      return Promise.resolve();
    }
  }
  w.AudioContext = Ctx;
  class Recorder {
    static isTypeSupported = (t: string) => t.startsWith("audio/webm");
    state = "inactive";
    ondataavailable: ((e: { data: Blob }) => void) | null = null;
    onstop: (() => void) | null = null;
    start() {
      this.state = "recording";
    }
    stop() {
      this.state = "inactive";
      setTimeout(() => {
        this.ondataavailable?.({ data: new Blob(["fake audio"], { type: "audio/webm" }) });
        this.onstop?.();
      }, 10);
    }
  }
  w.MediaRecorder = Recorder;
};

test("with Sarvam, answers are recorded in pieces, transcribed as you talk, and sent after 5 seconds of real silence (VI-9)", async ({ page }) => {
  await page.addInitScript(fakeSpeechOut);
  await page.addInitScript(fakeRecordingMic);
  await page.route("**/api/ai/voice/start", (route) =>
    route.fulfill({
      json: {
        questions: [{ text: OPENING, audio: null }],
        acks: [{ text: "Okay.", audio: null }],
        closing: { text: "That's the end of the interview.", audio: null },
        hear: "signed-token",
      },
    }),
  );
  const pieces: { url: string; type: string | undefined }[] = [];
  await page.route("**/api/ai/voice/hear**", (route) => {
    pieces.push({ url: route.request().url(), type: route.request().headers()["content-type"] });
    return route.fulfill({ json: { text: "Um, we retrieve relevant chunks and add them to the prompt." } });
  });
  const turns: { exchanges: { answer: string }[] }[] = [];
  await page.route("**/api/ai/voice/turn", (route) => {
    turns.push(route.request().postDataJSON());
    return route.fulfill({ json: { follow_up: null } });
  });
  await page.route("**/api/ai/voice/report", (route) => route.fulfill({ json: report }));

  await page.goto("/interview/simulator?question=what-is-rag");
  await page.getByRole("button", { name: "Start the AI interviewer" }).click();
  await expect(page.getByText(/recorded in short pieces and sent to Sarvam AI/)).toBeVisible();
  await page.getByRole("button", { name: "I agree, start the interview" }).click();
  const call = page.getByRole("dialog", { name: "Zarina" });

  // The piece is cut at the pause and transcribed while the learner is still "thinking"; the caption hides the "um".
  await expect(call.getByText("we retrieve relevant chunks and add them to the prompt.")).toBeVisible({ timeout: 8000 });
  await expect(call.getByText(/^Um,/)).toHaveCount(0);
  expect(pieces[0].url).toMatch(/\/api\/ai\/voice\/hear\?t=signed-token&q=what-is-rag$/);
  expect(pieces[0].type).toBe("audio/webm");
  // A thinking pause is not the end: nothing is sent for the first seconds of silence.
  await page.waitForTimeout(2000);
  expect(turns).toEqual([]);
  // After 5 seconds of real silence the answer is sent, with the words as said (the report counts fillers).
  await expect.poll(() => turns.length, { timeout: 8000 }).toBe(1);
  expect(turns[0].exchanges[0].answer).toBe("Um, we retrieve relevant chunks and add them to the prompt.");
  // The microphone is muted while it is not the learner's turn, so the interviewer's voice is never recorded.
  expect(await page.evaluate(() => (window as unknown as { __mic: { enabled: boolean } }).__mic.enabled)).toBe(false);
  await expect(page.getByRole("heading", { name: "Your AI interview report" })).toBeVisible({ timeout: 10_000 });
});

test("a transcription request that never answers cannot freeze the call: it says so and listens again (VI-9)", async ({ page }) => {
  await page.addInitScript(fakeSpeechOut);
  await page.addInitScript(fakeRecordingMic);
  await page.route("**/api/ai/voice/start", (route) =>
    route.fulfill({
      json: {
        questions: [{ text: OPENING, audio: null }],
        acks: [{ text: "Okay.", audio: null }],
        closing: { text: "That's the end of the interview.", audio: null },
        hear: "signed-token",
      },
    }),
  );
  await page.route("**/api/ai/voice/hear**", () => new Promise(() => {})); // never answers
  const turns: unknown[] = [];
  await page.route("**/api/ai/voice/turn", (route) => {
    turns.push(route.request().postDataJSON());
    return route.fulfill({ json: { follow_up: null } });
  });
  await page.goto("/interview/simulator?question=what-is-rag");
  await page.getByRole("button", { name: "Start the AI interviewer" }).click();
  await page.getByRole("button", { name: "I agree, start the interview" }).click();
  // 2.5 s of speech, 5 s of silence, then at most 8 s waiting for the text: then a clear message, not a frozen screen.
  await expect(page.getByRole("alert").filter({ hasText: "We couldn't catch that answer" })).toBeVisible({ timeout: 25_000 });
  expect(turns).toEqual([]); // not sent as an empty, skipped answer
  await expect(page.getByRole("button", { name: "Type" })).toBeEnabled();
});

test("a finished answer is sent after a short pause: the fast AI checks it sounds complete (VI-10)", async ({ page }) => {
  await page.addInitScript(fakeSpeechOut);
  await page.addInitScript(fakeRecordingMic);
  await page.route("**/api/ai/voice/start", (route) =>
    route.fulfill({
      json: {
        questions: [{ text: OPENING, audio: null }],
        acks: [{ text: "Okay.", audio: null }],
        closing: { text: "That's the end of the interview.", audio: null },
        hear: "signed-token",
      },
    }),
  );
  await page.route("**/api/ai/voice/hear**", (route) => route.fulfill({ json: { text: "We retrieve relevant chunks and add them to the prompt, then the model answers." } }));
  const checks: { questionId: string; asked: string; answer: string }[] = [];
  await page.route("**/api/ai/voice/end", (route) => {
    checks.push(route.request().postDataJSON());
    return route.fulfill({ json: { finished: true } });
  });
  const turns: { t: number }[] = [];
  await page.route("**/api/ai/voice/turn", (route) => {
    turns.push({ t: Date.now() });
    return route.fulfill({ json: { follow_up: null } });
  });
  await page.route("**/api/ai/voice/report", (route) => route.fulfill({ json: report }));
  await page.goto("/interview/simulator?question=what-is-rag");
  await page.getByRole("button", { name: "Start the AI interviewer" }).click();
  await page.getByRole("button", { name: "I agree, start the interview" }).click();
  await expect(page.getByText("then the model answers.")).toBeVisible({ timeout: 8000 });
  const heardAt = Date.now();
  // Sent well before the patient 5 seconds, because the check said the answer was finished.
  await expect.poll(() => turns.length, { timeout: 5000 }).toBe(1);
  expect(turns[0].t - heardAt).toBeLessThan(4000);
  expect(checks.length).toBe(1); // asked once per answer text, not every 200 ms
  expect(checks[0]).toMatchObject({ questionId: "what-is-rag", asked: expect.stringMatching(/What is RAG/), answer: expect.stringMatching(/^We retrieve/) });
});

test("Answer now stops the interviewer mid-sentence and starts listening (VI-10)", async ({ page }) => {
  // The interviewer's voice never finishes on its own, so only Answer now can move the call on.
  await page.addInitScript(() => {
    const spoken: string[] = [];
    (window as unknown as { __spoken: string[]; __cancelled: number }).__spoken = spoken;
    (window as unknown as { __cancelled: number }).__cancelled = 0;
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
        speak: (u: Utterance) => spoken.push(u.text),
        cancel: () => (window as unknown as { __cancelled: number }).__cancelled++,
        getVoices: () => [{ lang: "en-IN", localService: true, name: "India" }],
      },
    });
  });
  await page.addInitScript(fakeMicrophone, ["I would start with retrieval."]);
  await startRoute(page);
  await page.route("**/api/ai/voice/turn", (route) => route.fulfill({ json: { follow_up: null } }));
  await page.route("**/api/ai/voice/report", (route) => route.fulfill({ json: report }));
  await page.goto("/interview/simulator?question=what-is-rag");
  await page.getByRole("button", { name: "Start the AI interviewer" }).click();
  await page.getByRole("button", { name: "I agree, start the interview" }).click();
  const call = page.getByRole("dialog", { name: "Zarina" });
  const now = call.getByRole("button", { name: "Answer now" });
  await expect(now).toBeVisible();
  await now.click();
  await expect(call.getByText("I would start with retrieval.")).toBeVisible();
  await expect(call.getByRole("button", { name: "Done" })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __cancelled: number }).__cancelled)).toBeGreaterThan(0);
});

const usage = (page: Page, tier: "pro" | "free") =>
  page.route("**/api/ai/usage**", (route) => route.fulfill({ json: { show: true, tier, used: 0, limit: tier === "pro" ? 40 : 0 } }));

test("one mock interview: a Pro learner picks role, experience and company, and the interviewer gets them (VI-11)", async ({ page }) => {
  await page.addInitScript(fakeSpeechOut);
  await page.addInitScript(fakeMicrophone, ["Answer."]);
  await usage(page, "pro");
  const starts: { questionIds: string[]; setup?: unknown }[] = [];
  await startRoute(page, starts);
  await page.goto("/interview/simulator?path=genai-engineer");
  await expect(page.getByRole("heading", { name: "What are you preparing for?" })).toBeVisible();
  // VI-12: the page sells the AI interviewer; the free warm-up sits lower, marked as the lesser option.
  await expect(page.getByRole("heading", { level: 1, name: "Mock interviews that talk back" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Free warm-up" })).toBeVisible();
  // VI-12: the live line: her real opening line names the role and company as they are chosen.
  await expect(page.getByText(/practice interview for the Generative AI & LLM Engineer role\. We'll go through 3 questions/)).toBeVisible();
  await page.getByLabel("Experience needed").selectOption("mid");
  await page.getByLabel("Kind of questions").selectOption("scenarios");
  await page.getByLabel("Company (optional)").fill("Acme");
  await expect(page.getByText(/for the Generative AI & LLM Engineer role at Acme\./)).toBeVisible();
  const opening = await page.getByText(/^“Hi, I'm your AI interviewer/).textContent();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
  await page.getByRole("button", { name: "Start the AI interviewer" }).click();
  await page.getByRole("button", { name: "I agree, start the interview" }).click();
  await expect.poll(() => starts.length).toBe(1);
  expect(starts[0].setup).toEqual({ pathId: "genai-engineer", experience: "mid", company: "Acme" });
  expect(starts[0].questionIds).toHaveLength(3);
  // The preview did not lie: the first question asked is the one the opening line named.
  expect(opening).toContain((await page.getByRole("dialog", { name: "Zarina" }).getByText(/\?$/).first().textContent())?.trim().slice(-30));
});

test("a pasted job description plans the interview: bank questions plus one written for the job, sent back sealed (VI-11)", async ({ page }) => {
  await page.addInitScript(fakeSpeechOut);
  await page.addInitScript(fakeMicrophone, ["We would use Bedrock with a private VPC endpoint and log every call."]);
  await usage(page, "pro");
  const plans: { jd: string; count: number; company?: string; experience?: string }[] = [];
  await page.route("**/api/ai/voice/plan", (route) => {
    plans.push(route.request().postDataJSON());
    return route.fulfill({
      json: {
        plan: "sealed-plan",
        looksLikeJd: true,
        role: "GenAI Engineer",
        pathId: "genai-engineer",
        focus: ["RAG on AWS Bedrock"],
        questions: [
          { id: "what-is-rag", question: "What is RAG (retrieval-augmented generation)?", custom: false },
          { id: "jd-1", question: "How would you deploy a RAG app on AWS Bedrock for a bank?", custom: true },
        ],
      },
    });
  });
  const starts: { questionIds: string[]; plan?: string }[] = [];
  await startRoute(page, starts);
  const turns: { plan?: string; questionId: string }[] = [];
  await page.route("**/api/ai/voice/turn", (route) => {
    turns.push(route.request().postDataJSON());
    return route.fulfill({ json: { follow_up: null } });
  });
  await page.goto("/interview/simulator");
  await page.getByRole("radio", { name: "Paste a job description" }).check({ force: true });
  const plan = page.getByRole("button", { name: "Plan and start the AI interview" });
  const box = page.getByRole("textbox", { name: /^Job description/ });
  await box.fill("GenAI Engineer, Bengaluru.");
  await expect(plan).toBeDisabled(); // too short to plan from
  await box.fill("GenAI Engineer, Bengaluru. You will build RAG systems on AWS Bedrock for banking clients, evaluate LLM output and ship agents to production. 3+ years of Python.");
  await page.getByLabel("Company (optional)").fill("Acme");
  // Practising alone cannot use a job description; it says so instead of offering a broken start.
  await expect(page.getByText("Practising from a job description needs the AI interviewer.")).toBeVisible();
  expect((await wcag(page)).violations).toEqual([]);
  await plan.click();
  await expect.poll(() => plans.length).toBe(1);
  expect(plans[0]).toMatchObject({ count: 3, company: "Acme", jd: expect.stringMatching(/AWS Bedrock/) });
  expect(plans[0].experience).toBeUndefined(); // "as the job description says"
  await page.getByRole("button", { name: "I agree, start the interview" }).click();
  await expect.poll(() => starts.length).toBe(1);
  expect(starts[0]).toMatchObject({ questionIds: ["what-is-rag", "jd-1"], plan: "sealed-plan" });
  await expect.poll(() => turns.length, { timeout: 15_000 }).toBeGreaterThan(0);
  expect(turns[0]).toMatchObject({ plan: "sealed-plan", questionId: "what-is-rag" });
});

test("without Pro, the AI interviewer offers Pro and the free warm-up stays one tap away (VI-11, VI-12)", async ({ page }) => {
  await usage(page, "free");
  await page.goto("/interview/simulator");
  await expect(page.getByRole("link", { name: "Get Pro to start" })).toHaveAttribute("href", "/pricing");
  await expect(page.getByRole("button", { name: "Start the AI interviewer" })).toHaveCount(0);
  await page.getByRole("link", { name: "Or warm up free" }).click();
  await expect(page.getByRole("button", { name: /Type my answers instead|Start, typing my answers/ })).toBeVisible();
  await page.getByRole("radio", { name: "Paste a job description" }).check({ force: true });
  await expect(page.getByText(/Practising from a job description needs the AI interviewer/)).toBeVisible();
  await page.getByRole("button", { name: "choose a role instead" }).click();
  await expect(page.getByRole("button", { name: /Type my answers instead|Start, typing my answers/ })).toBeVisible();
  expect((await wcag(page)).violations).toEqual([]);
});

test("when the plan is refused, the reason and the way to Pro are shown (VI-11)", async ({ page }) => {
  await page.route("**/api/ai/voice/plan", (route) => route.fulfill({ status: 403, json: { error: "The AI voice interviewer is part of Pro.", upgrade: "/pricing" } }));
  await page.goto("/interview/simulator");
  await page.getByRole("radio", { name: "Paste a job description" }).check({ force: true });
  await page.getByRole("textbox", { name: /^Job description/ }).fill("x".repeat(200));
  await page.getByRole("button", { name: "Plan and start the AI interview" }).click();
  const alert = page.getByRole("alert").filter({ hasText: "The AI voice interviewer is part of Pro." });
  await expect(alert).toBeVisible();
  await expect(alert.getByRole("link", { name: "See Pro" })).toHaveAttribute("href", "/pricing");
});

test("how it works: the slider walks through the four stages to a sample report (VI-12)", async ({ page }) => {
  await page.goto("/interview/simulator");
  await page.getByRole("link", { name: "See a sample report" }).click();
  await expect(page.getByText("Verdict: Lean hire")).toBeVisible();
  const slider = page.getByRole("slider", { name: "Step of the interview" });
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(page.getByText("Zarina asks the question aloud")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("You answer, she waits for you")).toBeVisible();
  await page.getByRole("button", { name: "She digs in" }).click();
  await expect(page.getByText(/Which evals exactly/)).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});
