// Reads a PowerPoint (.pptx) in the browser (MB-12). A .pptx is a zip of XML; nothing is uploaded.
import JSZip from "jszip";
import type { BookPage } from "./chunk";

export type SlidePicture = { n: number; name: string; bytes: Uint8Array; mime: string };
export type ReadSlides = { pages: BookPage[]; pictures: SlidePicture[] };

const MIN_PICTURE_BYTES = 20_000; // logos and bullets are smaller; a photo, scan or diagram is not
const MIME: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", bmp: "image/bmp", webp: "image/webp" };

const decode = (t: string) =>
  t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d))).replace(/&amp;/g, "&");

/** The text of one slide's XML: one line per paragraph, the first line (the title) as a "# " heading. Pure, for tests. */
export function slideXmlToText(xml: string): string {
  const paragraphs = [...xml.matchAll(/<a:p\b[^>]*>([\s\S]*?)<\/a:p>/g)]
    .map((m) => decode([...m[1].matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)].map((t) => t[1]).join("")).trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return "";
  return [`# ${paragraphs[0]}`, ...paragraphs.slice(1)].join("\n");
}

/** The picture files a slide uses, from its relationships XML. Pure, for tests. */
export function slideImageTargets(rels: string): string[] {
  return [...rels.matchAll(/<Relationship\b[^>]*>/g)]
    .map((m) => m[0])
    .filter((r) => /relationships\/image"/.test(r))
    .map((r) => /Target="([^"]+)"/.exec(r)?.[1])
    .filter((t): t is string => !!t && !/^https?:/i.test(t))
    .map((t) => `ppt/${t.replace(/^(\.\.\/)+/, "").replace(/^\/?(ppt\/)?/, "")}`);
}

export async function readPptx(data: ArrayBuffer, maxSlides = 400): Promise<ReadSlides> {
  const zip = await JSZip.loadAsync(data);
  const slides = Object.keys(zip.files)
    .map((f) => ({ f, n: Number(/^ppt\/slides\/slide(\d+)\.xml$/.exec(f)?.[1]) }))
    .filter((s) => s.n > 0)
    .sort((a, b) => a.n - b.n)
    .slice(0, maxSlides);
  const pages: BookPage[] = [];
  const pictures: SlidePicture[] = [];
  let order = 0;
  for (const s of slides) {
    order += 1;
    pages.push({ n: order, text: slideXmlToText(await zip.files[s.f].async("string")) });
    const rels = zip.files[`ppt/slides/_rels/slide${s.n}.xml.rels`];
    if (!rels) continue;
    let best: SlidePicture | null = null;
    for (const target of slideImageTargets(await rels.async("string"))) {
      const file = zip.files[target];
      const mime = MIME[target.split(".").pop()?.toLowerCase() ?? ""];
      if (!file || !mime) continue;
      const bytes = await file.async("uint8array");
      if (bytes.length >= MIN_PICTURE_BYTES && (!best || bytes.length > best.bytes.length)) best = { n: order, name: target, bytes, mime };
    }
    if (best) pictures.push(best);
  }
  return { pages, pictures };
}
