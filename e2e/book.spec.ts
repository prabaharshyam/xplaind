import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { jsPDF } from "jspdf";

const wcag = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
const overflow = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test.use({ viewport: { width: 360, height: 740 } });

const prose = (topic: string) =>
  Array.from({ length: 14 }, (_, i) => `${topic} sentence ${i + 1} describes how ${topic.toLowerCase()} matters to a student preparing for the exam.`).join(" ");

/** A small PDF with real text and a bookmark per chapter, as a learner's book would have. */
function bookPdf(): Buffer {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setProperties({ title: "Biology for Class 11" });
  const chapters = ["Cell structure", "Photosynthesis", "Respiration"];
  chapters.forEach((title, i) => {
    if (i > 0) doc.addPage();
    doc.setFontSize(18).text(title, 48, 60);
    doc.setFontSize(11).text(doc.splitTextToSize(prose(title), 480) as string[], 48, 90);
    doc.outline.add(null, title, { pageNumber: i + 1 });
  });
  return Buffer.from(doc.output("arraybuffer"));
}

const saved = {
  version: 1,
  tests: [
    {
      id: "t1",
      createdOn: "2026-10-26",
      book: "Biology for Class 11",
      difficulty: "medium",
      minutes: 10,
      questions: [
        { id: "q1", question: "Where does photosynthesis happen?", options: ["Chloroplast", "Nucleus", "Ribosome", "Vacuole"], answer: 0, explanation: "The chapter places it in the chloroplast.", quote: "Photosynthesis takes place in the chloroplasts of green plant cells", page: 12, section: "Photosynthesis" },
        { id: "q2", question: "What does respiration release?", options: ["Oxygen only", "Energy from glucose", "Chlorophyll", "Starch"], answer: 1, explanation: "Respiration releases energy stored in glucose.", quote: "Respiration releases the energy stored in glucose", page: 20, section: "Respiration" },
        { id: "q3", question: "Which organelle releases that energy?", options: ["Golgi body", "Lysosome", "Mitochondrion", "Cell wall"], answer: 2, explanation: "The mitochondrion is where respiration happens.", quote: "The mitochondrion is the site of aerobic respiration", page: 21, section: "Respiration" },
      ],
    },
  ],
};

test("a PDF is read in the browser and its chapters can be chosen before any AI call (MB-1)", async ({ page }) => {
  await page.goto("/ai/book");
  await expect(page.getByRole("heading", { level: 1, name: "Study from my notes & books" })).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({ name: "biology.pdf", mimeType: "application/pdf", buffer: bookPdf() });
  await expect(page.getByRole("heading", { level: 2, name: "Biology for Class 11" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/3 pages · 3 sections/)).toBeVisible();
  for (const c of ["Cell structure", "Photosynthesis", "Respiration"]) await expect(page.getByRole("checkbox", { name: c })).toBeChecked();
  await page.getByRole("checkbox", { name: "Respiration" }).uncheck();
  await expect(page.getByText("2 chosen")).toBeVisible();
  await page.getByRole("radio", { name: "Hard: apply and compare" }).check();
  await page.getByLabel("Number of questions").selectOption("5");
  await page.getByLabel("Time allowed").selectOption("10");
  await expect(page.getByText("AI features are not switched on yet")).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);
});

test("a file with no text is refused with a clear reason", async ({ page }) => {
  await page.goto("/ai/book");
  await page.locator('input[type="file"]').setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("too short") });
  await expect(page.getByRole("alert").filter({ hasText: "could not find enough text" })).toBeVisible();
});

test("a saved test is timed, scored and explained from the book, and the report downloads as a PDF (MB-3, MB-4)", async ({ page }) => {
  await page.addInitScript((s) => localStorage.setItem("xplaind.book.v1", JSON.stringify(s)), saved);
  await page.goto("/ai/book");
  await page.getByRole("button", { name: /Take the test: Biology for Class 11/ }).click();
  await expect(page.getByRole("timer", { name: "Time left" })).toHaveText(/^(10:00|9:5\d)$/);
  await page.getByRole("radio", { name: "Chloroplast" }).check();
  await page.getByRole("button", { name: "Next question" }).click();
  await page.getByRole("radio", { name: "Oxygen only" }).check();
  await page.getByRole("button", { name: "Next question" }).click();
  expect((await wcag(page)).violations).toEqual([]);
  await page.getByRole("button", { name: "Finish the test" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "1 question is not answered yet" })).toBeVisible();
  await page.getByRole("button", { name: "Yes, finish" }).click();

  await expect(page.getByRole("heading", { name: "1 of 3 right (33%)" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Where you are strong" })).toContainText("No section scored 80% or more");
  await expect(page.getByRole("region", { name: "Focus on these next" })).toContainText("Respiration: 0 of 2 right. Reread pp. 20–21.");
  await expect(page.getByText("From your book: Photosynthesis, page 12")).toBeVisible();
  await expect(page.getByText("“Respiration releases the energy stored in glucose”")).toBeVisible();
  await expect(page.getByText("Your answer: Oxygen only")).toBeVisible();
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download the report (PDF)" }).click();
  expect((await download).suggestedFilename()).toBe("xplaind-Biology-for-Class-11-report.pdf");

  await page.getByRole("button", { name: "New test" }).click();
  await expect(page.getByRole("button", { name: /See the report: Biology for Class 11/ })).toBeVisible();
});

test("the book API refuses when AI is off and checks what it is sent", async ({ request }) => {
  const ok = { book: "Bio", difficulty: "easy", count: 5, excerpts: [{ id: "c1", page: 1, section: "One", text: "Some text." }] };
  expect((await request.post("/api/ai/book", { data: ok })).status()).toBe(503);
  expect((await request.post("/api/ai/book", { data: { ...ok, count: 500 } })).status()).toBe(400);
});

test("flashcards made from a file flip, remember 'Again' and download as CSV (MB-5)", async ({ page }) => {
  await page.addInitScript(() => {
    const deck = {
      id: "d1",
      createdOn: "2026-11-06",
      book: "Biology for Class 11",
      marks: {},
      cards: [
        { id: "c1", front: "Where does photosynthesis happen?", back: "In the chloroplast.", quote: "Photosynthesis takes place in the chloroplast", page: 12, section: "Photosynthesis" },
        { id: "c2", front: "What does respiration release?", back: "Energy stored in glucose.", quote: "Respiration releases the energy stored in glucose", page: 20, section: "Respiration" },
      ],
    };
    localStorage.setItem("xplaind.bookcards.v1", JSON.stringify({ version: 1, decks: [deck] }));
  });
  await page.goto("/ai/book");
  await page.getByRole("button", { name: /^Study the flashcards: Biology for Class 11/ }).click();
  await expect(page.getByText("Where does photosynthesis happen?")).toBeVisible();
  await page.getByRole("button", { name: "Flip the card" }).click();
  await expect(page.getByText("In the chloroplast.")).toBeVisible();
  await expect(page.getByText("From your file: Photosynthesis, page 12")).toBeVisible();
  expect((await wcag(page)).violations).toEqual([]);
  await page.getByRole("button", { name: "Again" }).click();
  await page.getByRole("button", { name: "Flip the card" }).click();
  await page.getByRole("button", { name: "I knew it" }).click();
  await expect(page.getByText("You knew 1 of 2")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download the cards (CSV)" }).click();
  expect((await download).suggestedFilename()).toMatch(/flashcards\.csv$/);
  expect(await overflow(page)).toBe(false);
  // "Again" is saved, so that card comes first next time.
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("xplaind.bookcards.v1")!).decks[0]);
  expect(saved.marks).toEqual({ c1: "again", c2: "knew" });
  // MB-10: "Again" comes back tomorrow (box 0); a known card waits longer (box 1).
  expect(saved.schedule.c1.box).toBe(0);
  expect(saved.schedule.c2.box).toBe(1);
  expect(saved.schedule.c2.due > saved.schedule.c1.due).toBe(true);
});

test("after reading a file, the learner can choose flashcards instead of a test (MB-5)", async ({ page }) => {
  await page.goto("/ai/book");
  await page.locator('input[type="file"]').setInputFiles({ name: "biology.pdf", mimeType: "application/pdf", buffer: bookPdf() });
  await expect(page.getByRole("heading", { level: 2, name: "Biology for Class 11" })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("radio", { name: /Flashcards/ }).check();
  await expect(page.getByLabel("Number of cards")).toBeVisible();
  await expect(page.getByLabel("Time allowed")).toHaveCount(0);
  expect((await wcag(page)).violations).toEqual([]);
});

test("the home page has its own card for Study from my notes & books (MB-6, UX-4)", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Your notes" }).click();
  const card = page.getByRole("tabpanel", { name: "Your notes" });
  await expect(card.getByRole("heading", { name: "Turn your own notes into a test and flashcards" })).toBeVisible();
  await expect(card.getByRole("link", { name: "Try it with your notes" })).toHaveAttribute("href", "/ai/book");
});

test("ask your notes is one of the three choices, and its API checks input and needs AI (MB-8)", async ({ page, request }) => {
  await page.goto("/ai/book");
  await page.locator('input[type="file"]').setInputFiles({ name: "biology.pdf", mimeType: "application/pdf", buffer: bookPdf() });
  await expect(page.getByRole("heading", { level: 2, name: "Biology for Class 11" })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("radio", { name: /Ask your notes/ }).check();
  await expect(page.getByRole("heading", { name: "Ask your notes" })).toBeVisible();
  await expect(page.getByLabel("Number of questions")).toHaveCount(0);
  expect(await overflow(page)).toBe(false);
  expect((await wcag(page)).violations).toEqual([]);

  const ok = { book: "Bio", question: "Where does photosynthesis happen?", excerpts: [{ id: "c1", page: 1, section: "One", text: "Photosynthesis happens in the chloroplast." }] };
  expect((await request.post("/api/ai/book-ask", { data: ok })).status()).toBe(503);
  expect((await request.post("/api/ai/book-ask", { data: { ...ok, question: "x".repeat(600) } })).status()).toBe(400);
  // Nothing in the file matched: a plain "not in your notes", with no AI call.
  const none = await request.post("/api/ai/book-ask", { data: { ...ok, excerpts: [] } });
  expect(none.status()).toBe(200);
  expect(await none.json()).toMatchObject({ found: false, citations: [] });
});

test("a report offers a retest of the weak sections and turns misses into review cards that come due (MB-9, MB-10)", async ({ page }) => {
  const done = { ...saved, tests: [{ ...saved.tests[0], result: { answers: [0, 0, null], seconds: 120, finishedOn: "2026-10-26" } }] };
  await page.addInitScript((s) => localStorage.setItem("xplaind.book.v1", JSON.stringify(s)), done);
  await page.goto("/ai/book");
  await page.getByRole("button", { name: /See the report: Biology for Class 11/ }).click();
  const retest = page.getByRole("region", { name: "Test me on what I missed" });
  await expect(retest).toContainText("5 new questions on the section you found hardest: Respiration");
  // The file is not kept, so the retest asks for it again.
  await expect(retest.getByText("Open the file again")).toBeVisible();

  await page.getByRole("button", { name: "Add to my review cards" }).click();
  await page.getByRole("button", { name: "Review them now" }).click();
  await expect(page.getByRole("heading", { name: "Missed questions: Biology for Class 11" })).toBeVisible();
  await expect(page.getByText("What does respiration release?")).toBeVisible();
  expect((await wcag(page)).violations).toEqual([]);
  await page.getByRole("button", { name: "Flip the card" }).click();
  await expect(page.getByText("Energy from glucose. Respiration releases energy stored in glucose.")).toBeVisible();
  await page.getByRole("button", { name: "I knew it" }).click();
  await page.getByRole("button", { name: "Flip the card" }).click();
  await page.getByRole("button", { name: "Again" }).click();
  await page.getByRole("button", { name: "Done for today" }).click();

  // Both cards are scheduled for later, so nothing is due today.
  await expect(page.getByRole("heading", { name: "No cards due today" })).toBeVisible();
  await expect(page.getByText(/2 cards · .* · next review \d{4}-\d{2}-\d{2}/)).toBeVisible();
  expect(await overflow(page)).toBe(false);
});

test("cards that are due today are counted and reviewed first (MB-10)", async ({ page }) => {
  await page.addInitScript(() => {
    const card = (id: string, front: string) => ({ id, front, back: "b", quote: "q", page: 1, section: "S" });
    const deck = {
      id: "d1",
      createdOn: "2026-11-01",
      book: "Economics notes",
      marks: {},
      schedule: { c1: { box: 1, due: "2026-11-02" }, c2: { box: 3, due: "2099-01-01" } },
      cards: [card("c1", "Overdue card"), card("c2", "Later card"), card("c3", "New card")],
    };
    localStorage.setItem("xplaind.bookcards.v1", JSON.stringify({ version: 1, decks: [deck] }));
  });
  await page.goto("/ai/book");
  await expect(page.getByRole("heading", { name: "2 cards due today" })).toBeVisible();
  await page.getByRole("button", { name: "Review now" }).click();
  await expect(page.getByText("Card 1 of 2")).toBeVisible();
  await expect(page.getByText("Overdue card")).toBeVisible();
  expect((await wcag(page)).violations).toEqual([]);
});
