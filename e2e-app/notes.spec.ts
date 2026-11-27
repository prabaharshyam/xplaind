import { jsPDF } from "jspdf";
import { expect, test } from "./signed-in";

const prose = (topic: string) => Array.from({ length: 14 }, (_, i) => `${topic} sentence ${i + 1} describes how ${topic.toLowerCase()} matters to a student.`).join(" ");
function bookPdf(): Buffer {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setProperties({ title: "Biology for Class 11" });
  ["Cell structure", "Photosynthesis", "Respiration"].forEach((title, i) => {
    if (i > 0) doc.addPage();
    doc.setFontSize(18).text(title, 48, 60);
    doc.setFontSize(11).text(doc.splitTextToSize(prose(title), 480) as string[], 48, 90);
    doc.outline.add(null, title, { pageNumber: i + 1 });
  });
  return Buffer.from(doc.output("arraybuffer"));
}

test("Ask on selected notes text puts it into Ask your notes: beside the notes on a laptop, in its tab on a phone (APP-4)", async ({ page }) => {
  const notes = {
    version: 1,
    notes: [{ id: "n1", book: "Biology for Class 11", createdOn: "2026-11-27", depth: "summary", sections: [{ heading: "Photosynthesis", points: [{ term: "Chloroplast", text: "Where green plants make food from light.", quote: "q", page: 2, section: "Photosynthesis" }] }] }],
  };
  await page.addInitScript((n) => localStorage.setItem("xplaind.book-notes.v1", JSON.stringify(n)), notes);
  await page.goto("/ai/book");
  await page.locator('input[type="file"]').setInputFiles({ name: "biology.pdf", mimeType: "application/pdf", buffer: bookPdf() });
  const point = page.locator("[data-point='0-0']");
  await expect(point).toBeVisible({ timeout: 20_000 });
  await point.scrollIntoViewIfNeeded();
  await point.evaluate((li) => {
    const range = document.createRange();
    range.selectNodeContents(li.childNodes[1] ?? li);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
  });
  await page.getByRole("toolbar", { name: "Selected text" }).getByRole("button", { name: "Ask" }).click();
  const box = page.getByRole("textbox", { name: /question/i });
  await expect(box).toHaveValue(/^Explain this: ".*Where green plants make food from light\./);
  if (page.viewportSize()!.width < 1280) await expect(page.getByRole("tab", { name: "Ask your notes" })).toHaveAttribute("aria-selected", "true");
  else await expect(page.getByRole("complementary", { name: "Ask your notes" })).toBeVisible();
});
