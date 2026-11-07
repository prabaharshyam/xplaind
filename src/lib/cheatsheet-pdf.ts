// CS-2: a cheatsheet as a two-column PDF, made in the browser. jsPDF loads only on request.
import { pdfSafe } from "@/lib/book/pdf-report";
import type { Cheatsheet } from "@/lib/content/schema";

export async function downloadCheatsheetPdf(sheet: Cheatsheet): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 36;
  const GAP = 18;
  const colW = (W - 2 * M - GAP) / 2;
  let col = 0;
  let y = M;

  doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(76, 29, 149);
  doc.text(pdfSafe(`${sheet.title} cheatsheet`), M, y + 4);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(90, 90, 100);
  const sum = doc.splitTextToSize(pdfSafe(sheet.summary), W - 2 * M) as string[];
  doc.text(sum, M, y + 20);
  y += 26 + sum.length * 11;
  const top = y;

  const room = (h: number) => {
    if (y + h <= H - M) return;
    if (col === 0) {
      col = 1;
      y = top;
    } else {
      doc.addPage();
      col = 0;
      y = M;
    }
  };
  const x = () => M + col * (colW + GAP);

  for (const s of sheet.sections) {
    room(30);
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(76, 29, 149);
    doc.text(pdfSafe(s.title), x(), y + 10);
    y += 18;
    for (const it of s.items) {
      doc.setFont("helvetica", "bold").setFontSize(9);
      const t = doc.splitTextToSize(pdfSafe(it.term), colW) as string[];
      doc.setFont("helvetica", "normal").setFontSize(8.5);
      const d = doc.splitTextToSize(pdfSafe(it.detail), colW) as string[];
      doc.setFont("courier", "normal").setFontSize(7.5);
      const c = it.code ? (doc.splitTextToSize(pdfSafe(it.code), colW - 8) as string[]) : [];
      const h = t.length * 11 + d.length * 10.5 + (c.length ? c.length * 9 + 8 : 0) + 6;
      room(h);
      doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(24, 24, 27);
      doc.text(t, x(), y + 8);
      y += t.length * 11;
      doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(63, 63, 70);
      doc.text(d, x(), y + 8);
      y += d.length * 10.5;
      if (c.length) {
        doc.setFillColor(244, 244, 245).rect(x(), y + 2, colW, c.length * 9 + 6, "F");
        doc.setFont("courier", "normal").setFontSize(7.5).setTextColor(39, 39, 42);
        doc.text(c, x() + 4, y + 10);
        y += c.length * 9 + 8;
      }
      y += 6;
    }
    y += 6;
  }
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(130, 130, 140);
    doc.text(`xplaind.in/cheatsheets/${sheet.id}  ·  page ${p} of ${pages}`.replace("·", "-"), M, H - 18);
  }
  doc.save(`xplaind-${sheet.id}-cheatsheet.pdf`);
}
