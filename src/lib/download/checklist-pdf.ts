// RD-1: a roadmap as a printable checklist, made in the browser. jsPDF loads only
// when the learner asks for the file.
import { pdfSafe } from "@/lib/book/pdf-report";
import type { TopicState } from "@/lib/roadmap/progress";
import type { RoadmapModel } from "@/lib/roadmap/view";

export async function downloadChecklistPdf(model: RoadmapModel, opts: { name: string | null; today: string; siteUrl: string; stateOf: (stopId: string) => TopicState }): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 44;
  let y = M;

  const ensure = (h: number) => {
    if (y + h > H - M) {
      doc.addPage();
      y = M;
    }
  };
  const text = (s: string, x: number, size: number, bold = false, color: [number, number, number] = [24, 24, 27], maxW = W - M - x) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(pdfSafe(s), maxW) as string[];
    const lh = size * 1.3;
    for (const l of lines) {
      ensure(lh);
      doc.text(l, x, y + size);
      y += lh;
    }
  };
  /** An empty box to tick with a pen, or a ticked one for what is already done. */
  const box = (x: number, done: boolean) => {
    doc.setDrawColor(63, 63, 70);
    doc.setLineWidth(0.9);
    doc.rect(x, y + 2, 10, 10);
    if (done) {
      doc.setDrawColor(4, 120, 87);
      doc.setLineWidth(1.6);
      doc.line(x + 2, y + 7, x + 4.5, y + 10);
      doc.line(x + 4.5, y + 10, x + 9, y + 3.5);
    }
  };

  text(`${model.name} roadmap: checklist`, M, 20, true, [4, 120, 87]);
  text(`${opts.name ? `For ${opts.name} · ` : ""}Printed ${opts.today} · Tick each topic as you finish it.`.replace(/·/g, "-"), M, 10, false, [82, 82, 91]);
  y += 4;
  text("Started on: ____________    Target finish: ____________    Hours a week: ______", M, 10, false, [82, 82, 91]);
  y += 10;

  let total = 0;
  for (const s of model.sections) {
    ensure(48);
    y += 8;
    text(`${s.code}  ${s.title}`, M, 13, true);
    if (s.summary) text(s.summary, M, 9.5, false, [82, 82, 91]);
    y += 4;
    for (const t of s.topics) {
      const done = t.stopId ? ["done", "skipped"].includes(opts.stateOf(t.stopId)) : false;
      const meta = [t.hours ? `${t.hours} h` : null, t.optional ? "optional" : null, t.stopId ? null : "lesson coming soon"].filter(Boolean).join(", ");
      ensure(16);
      box(M + 4, done);
      const start = y;
      text(`${t.title}${meta ? `  (${meta})` : ""}`, M + 22, 10.5, false, [24, 24, 27], W - 2 * M - 22);
      if (y - start < 15) y = start + 15;
      total++;
    }
    if (s.project) {
      ensure(30);
      y += 4;
      box(M + 4, false);
      text(`Project: ${s.project.title}`, M + 22, 10.5, true, [24, 24, 27], W - 2 * M - 22);
      for (const d of s.project.deliverables.slice(0, 4)) text(`- ${d}`, M + 34, 9.5, false, [63, 63, 70], W - 2 * M - 34);
    }
  }

  y += 12;
  ensure(80);
  text("Notes", M, 12, true);
  doc.setDrawColor(212, 212, 216);
  doc.setLineWidth(0.5);
  for (let i = 0; i < 4; i++) {
    y += 18;
    ensure(18);
    doc.line(M, y, W - M, y);
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122);
    doc.text(pdfSafe(`${total} topics - lessons, free courses and checks for each at ${opts.siteUrl}/roadmap/${model.pathId} - page ${p} of ${pages}`), M, H - 22);
  }
  doc.save(`xplaind-${model.pathId}-checklist.pdf`);
}
