// Picture pages in a learner's notes (MB-12): drawn small in the browser, then read by the AI (Pro only).
import { MAX_SCAN_IMAGES } from "@/lib/ai/scan";
import type { BookPage } from "./chunk";

export const MAX_PICTURE_PAGES = 30;
export const MAX_SIDE = 1400; // pixels on the longest side: readable print, and each picture stays well under 360 KB
const JPEG_QUALITY = 0.72;
const CHAR_BUDGET = 470_000; // base64 characters; the server refuses more than 480,000

export type PicturePage = { n: number; data: string }; // data is base64 JPEG without the "data:" prefix

/** A page with this little text is probably a scan or a picture. Pure, for tests. */
export const looksLikePicture = (text: string) => text.replace(/\s+/g, "").length < 40;

/** Draws a canvas to a base64 JPEG, lowering quality until it fits what the server accepts. */
export function canvasToJpeg(canvas: HTMLCanvasElement): string | null {
  for (const q of [JPEG_QUALITY, 0.55, 0.4]) {
    const url = canvas.toDataURL("image/jpeg", q);
    const data = url.slice(url.indexOf(",") + 1);
    if (data.length <= CHAR_BUDGET) return data;
  }
  return null;
}

export function fitSize(w: number, h: number, max = MAX_SIDE): { w: number; h: number } {
  const k = Math.min(1, max / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}

/** An image file (png, jpg and the like) to a base64 JPEG on a white background. */
export async function imageBytesToJpeg(bytes: Uint8Array, mime: string): Promise<string | null> {
  const bitmap = await createImageBitmap(new Blob([bytes as BlobPart], { type: mime }));
  try {
    const { w, h } = fitSize(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvasToJpeg(canvas);
  } finally {
    bitmap.close();
  }
}

export type ScanResult = { pages: BookPage[]; read: number; stopped?: { message: string; upgrade?: string; signin?: boolean } };

/** Sends the pictures four at a time and returns the text found, keyed to the page numbers. Nothing is kept by the server. */
export async function readPictures(pictures: PicturePage[], onProgress: (done: number, total: number) => void, fetcher: typeof fetch = fetch): Promise<ScanResult> {
  const pages: BookPage[] = [];
  let done = 0;
  onProgress(0, pictures.length);
  for (let i = 0; i < pictures.length; i += MAX_SCAN_IMAGES) {
    const batch = pictures.slice(i, i + MAX_SCAN_IMAGES);
    let res: Response;
    try {
      res = await fetcher("/api/ai/book-pictures", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ images: batch.map((p) => ({ id: p.n, data: p.data })) }),
      });
    } catch {
      return { pages, read: done, stopped: { message: "We could not reach the reader. Check your connection and try again." } };
    }
    const payload = (await res.json().catch(() => ({}))) as { pages?: { id: number; text: string }[]; error?: string; upgrade?: string; signin?: boolean };
    if (!res.ok || !payload.pages) {
      return { pages, read: done, stopped: { message: payload.error ?? "The pictures could not be read just now. Try again in a minute.", upgrade: payload.upgrade, signin: payload.signin } };
    }
    for (const p of payload.pages) if (p.text.trim()) pages.push({ n: p.id, text: p.text });
    done += batch.length;
    onProgress(done, pictures.length);
  }
  return { pages, read: done };
}

/** Puts the picture text into the book: on a page with no text it is the page; on a slide it follows the slide's own text. Pure, for tests. */
export function mergePicturePages(base: BookPage[], found: BookPage[]): BookPage[] {
  const by = new Map(found.map((p) => [p.n, p.text]));
  return base.map((p) => {
    const extra = by.get(p.n);
    if (!extra) return p;
    return { n: p.n, text: p.text.trim() ? `${p.text.trim()}\n${extra}` : extra };
  });
}
