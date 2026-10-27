// MB-3: the test report as a PDF file, made in the browser. jsPDF loads only when the
// learner asks for the file.
import { type BookReport, type BookTest, DIFFICULTY_LABEL, formatSeconds, pageList } from "./report";

/** jsPDF's built-in fonts cover Latin-1 only, so common symbols are spelled out and the rest replaced. */
export function pdfSafe(s: string): string {
  return s
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—―]/g, "-")
    .replace(/…/g, "...")
    .replace(/₹/g, "Rs ")
    .replace(/[•·]/g, "-")
    .replace(/[^\x09\x0a\x0d\x20-\x7e\xa0-\xff]/g, "?");
}

export async function downloadReportPdf(test: BookTest, report: BookReport): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = M;

  const ensure = (h: number) => {
    if (y + h > H - M) {
      doc.addPage();
      y = M;
    }
  };
  const write = (text: string, opts: { size?: number; bold?: boolean; color?: [number, number, number]; indent?: number; gap?: number } = {}) => {
    const { size = 11, bold = false, color = [24, 24, 27], indent = 0, gap = 4 } = opts;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(pdfSafe(text), W - 2 * M - indent) as string[];
    const lh = size * 1.35;
    for (const l of lines) {
      ensure(lh);
      doc.text(l, M + indent, y + size);
      y += lh;
    }
    y += gap;
  };

  write("Ask me from my book: test report", { size: 18, bold: true, color: [4, 120, 87] });
  write(test.book, { size: 13, bold: true });
  write(`${DIFFICULTY_LABEL[test.difficulty]} · ${test.questions.length} questions · ${test.minutes} minutes allowed · taken ${test.result?.finishedOn ?? test.createdOn}`.replace(/·/g, "-"), { size: 10, color: [82, 82, 91], gap: 12 });

  write(`Score: ${report.right} of ${report.total} (${report.percent}%)`, { size: 15, bold: true });
  write(`Answered ${report.answered} of ${report.total} in ${formatSeconds(report.seconds)}. ${report.verdict}`, { gap: 12 });

  write("Where you are strong", { size: 13, bold: true, color: [4, 120, 87] });
  if (report.strong.length) for (const t of report.strong) write(`- ${t.section}: ${t.right} of ${t.total} right`, { indent: 8, gap: 2 });
  else write("No section scored 80% or more yet.", { indent: 8 });
  y += 8;
  write("Focus on these next", { size: 13, bold: true, color: [190, 18, 60] });
  if (report.focus.length) for (const t of report.focus) write(`- ${t.section}: ${t.right} of ${t.total} right. Reread ${pageList(t.pages)}.`, { indent: 8, gap: 2 });
  else write("No section scored under 60%. Well done.", { indent: 8 });
  y += 8;
  write("Every section", { size: 13, bold: true });
  for (const t of report.topics) write(`- ${t.section}: ${t.percent}% (${t.right} of ${t.total})`, { indent: 8, gap: 2 });
  y += 12;

  write("Questions, answers and where to find them in the book", { size: 13, bold: true });
  test.questions.forEach((q, i) => {
    const mine = test.result?.answers[i] ?? null;
    const ok = mine === q.answer;
    ensure(60);
    y += 6;
    write(`${i + 1}. ${q.question}`, { bold: true });
    write(ok ? "Right" : mine === null ? "Not answered" : `Your answer: ${q.options[mine]}`, { size: 10, bold: true, color: ok ? [4, 120, 87] : [190, 18, 60], indent: 12, gap: 2 });
    write(`Correct answer: ${q.options[q.answer]}`, { size: 10, indent: 12, gap: 2 });
    write(q.explanation, { size: 10, color: [63, 63, 70], indent: 12, gap: 2 });
    write(`From the book (${q.section}, page ${q.page}): "${q.quote}"`, { size: 10, color: [82, 82, 91], indent: 12, gap: 6 });
  });

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122);
    doc.text(`Xplaind - questions written by AI from your book; check anything important against the page. Page ${p} of ${pages}`, M, H - 24);
  }
  const name = pdfSafe(test.book).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60) || "book";
  doc.save(`xplaind-${name}-report.pdf`);
}
