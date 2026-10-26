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
  await expect(page.getByRole("heading", { level: 1, name: "Ask me from my book" })).toBeVisible();
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
