// SE-3: one way to describe a page to search engines, AI answer engines and link previews.
import type { Metadata } from "next";

/** Trims to a length search results show in full, ending on a whole word. */
export function clip(text: string, max = 155): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s]+$/, "")}…`;
}

/**
 * Title, description, canonical address and share-preview tags for a page. `title` is the
 * page's own name; the layout adds " | Xplaind" unless the title would then be too long.
 */
export function pageMeta({
  title,
  description,
  path,
  type = "website",
  publishedTime,
  modifiedTime,
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
}): Metadata {
  const desc = clip(description);
  // Search results show about 60 characters of a title; keep the brand only when it fits.
  const full = title.length + " | Xplaind".length <= 60;
  return {
    title: full ? title : { absolute: clip(title, 60) },
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      title,
      description: desc,
      url: path,
      type,
      ...(type === "article" ? { publishedTime, modifiedTime } : {}),
    },
    twitter: { card: "summary_large_image", title, description: desc },
  };
}
