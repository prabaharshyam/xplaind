// SE-3: one way to describe a page to search engines, AI answer engines and link previews.
import type { Metadata } from "next";

/** Trims to a length search results show in full, ending on a whole word. */
export function clip(text: string, max = 155): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s]+$/, "")}…`;
}

const BRAND = " | Xplaind";

/**
 * SE-8: picks the most descriptive title that still shows in full in a search result (about 60
 * characters). Give the variants longest-first: the first one that fits wins, because the words
 * people search with matter more than the brand; " | Xplaind" is added only when it still fits.
 */
export function fitTitle(variants: string[]): { text: string; brand: boolean } {
  const pick = variants.find((v) => v.length <= 60);
  if (pick) return { text: pick, brand: pick.length + BRAND.length <= 60 };
  return { text: clip(variants[variants.length - 1], 60), brand: false };
}

/** SE-8: a name in the middle of a sentence: "data structures and algorithms", but "AI basics" and "RAG" keep their capitals. */
export function inSentence(text: string): string {
  return /^[A-Z][a-z]/.test(text) ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

const SMALL = new Set(["a", "an", "and", "as", "at", "by", "for", "from", "in", "of", "on", "or", "the", "to", "vs", "with"]);

/** SE-8: "Retrieval and RAG" from "Retrieval and RAG", "Data Structures and Algorithms" from "Data structures and algorithms", for titles. */
export function titleCase(text: string): string {
  return text
    .split(" ")
    .map((w, i) => (i > 0 && SMALL.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** SE-8: title variants for a role roadmap, longest first. */
export function roadmapTitles(name: string, year: string): string[] {
  return [
    `${name} Roadmap ${year}: Free, Step by Step`,
    `${name} Roadmap ${year}: Free Guide`,
    `${name} Roadmap ${year}`,
    `${name} Roadmap`,
  ];
}

/**
 * Title, description, canonical address and share-preview tags for a page. `title` is the
 * page's own name, or several from longest to shortest (see fitTitle); the layout adds
 * " | Xplaind" unless the title would then be too long.
 */
export function pageMeta({
  title,
  description,
  path,
  type = "website",
  publishedTime,
  modifiedTime,
}: {
  title: string | string[];
  description: string;
  path: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
}): Metadata {
  const desc = clip(description);
  // Search results show about 60 characters of a title; keep the brand only when it fits.
  const fit = fitTitle(Array.isArray(title) ? title : [title]);
  const share = Array.isArray(title) ? title[0] : title;
  return {
    title: fit.brand ? fit.text : { absolute: fit.text },
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      title: share,
      description: desc,
      url: path,
      type,
      ...(type === "article" ? { publishedTime, modifiedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: share, description: desc },
  };
}
