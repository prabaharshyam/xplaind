// Reads a book in the browser (MB-1). A PDF is opened with PDF.js; nothing is uploaded.
import { type BookPage, type BookSection, pagesFromText } from "./chunk";

export const MAX_FILE_MB = 60;
export const MAX_PAGES = 1500;

export type ReadBook = { title: string; pages: BookPage[]; outline: BookSection[] };

const titleFromName = (name: string) => name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").trim() || "My book";

export async function readBookFile(file: File, onProgress?: (done: number, total: number) => void): Promise<ReadBook> {
  if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`That file is over ${MAX_FILE_MB} MB. Try a smaller PDF, or one chapter at a time.`);
  if (/\.(txt|md|markdown)$/i.test(file.name) || file.type.startsWith("text/")) {
    const { pages, outline } = pagesFromText(await file.text());
    return { title: titleFromName(file.name), pages, outline };
  }
  if (/\.docx$/i.test(file.name) || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    // A Word file: mammoth turns it into HTML in the browser; headings become chapters.
    const mammoth = await import("mammoth");
    const { value } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const { pages, outline } = pagesFromText(docxHtmlToText(value));
    return { title: titleFromName(file.name), pages, outline };
  }
  if (/\.doc$/i.test(file.name)) throw new Error("Old .doc files cannot be read. Save it as .docx or PDF in Word, then try again.");
  if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") throw new Error("Please choose a PDF, a Word (.docx) file, or a .txt or .md file.");

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  try {
    const total = Math.min(doc.numPages, MAX_PAGES);
    const pages: BookPage[] = [];
    for (let n = 1; n <= total; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      let text = "";
      for (const item of content.items) {
        if (!("str" in item)) continue;
        text += item.str + (item.hasEOL ? "\n" : "");
      }
      pages.push({ n, text });
      page.cleanup();
      if (n % 10 === 0 || n === total) onProgress?.(n, total);
    }

    // The outline (bookmarks) gives chapter titles and the page each starts on.
    const outline: BookSection[] = [];
    const items = (await doc.getOutline()) ?? [];
    const top = items.length >= 3 ? items : items.flatMap((i) => [i, ...(i.items ?? [])]);
    for (const item of top.slice(0, 200)) {
      try {
        const dest = typeof item.dest === "string" ? await doc.getDestination(item.dest) : item.dest;
        const ref = dest?.[0];
        if (!ref) continue;
        const index = typeof ref === "number" ? ref : await doc.getPageIndex(ref as Parameters<typeof doc.getPageIndex>[0]);
        outline.push({ title: item.title.trim().slice(0, 120), startPage: index + 1 });
      } catch {
        // A broken bookmark is skipped; the book still reads.
      }
    }
    const meta = (await doc.getMetadata().catch(() => null))?.info as { Title?: string } | undefined;
    const title = meta?.Title?.trim() && meta.Title.trim().length > 2 ? meta.Title.trim().slice(0, 160) : titleFromName(file.name);
    return { title, pages, outline };
  } finally {
    void task.destroy();
  }
}

/** Word HTML from mammoth to plain text, with headings as "# " lines so they become chapters. Pure, for tests. */
export function docxHtmlToText(html: string): string {
  const decode = (t: string) =>
    t
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
  return decode(
    html
      .replace(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi, (_, t: string) => `\n# ${t.replace(/<[^>]+>/g, "").trim()}\n`)
      .replace(/<\/(p|li|h[4-6]|tr)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
