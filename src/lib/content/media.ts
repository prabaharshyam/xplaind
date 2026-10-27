// RM-4: how a resource is labelled and whether it can play on the page. Pure, so the
// cards, the lesson panel and tests share one set of rules.

/** A YouTube video or playlist that can play inside Xplaind. Channels cannot be embedded. */
export type Embed = { kind: "video"; id: string } | { kind: "playlist"; id: string };

const host = (url: string): string | null => {
  try {
    return new URL(url).hostname.replace(/^www\.|^m\./, "");
  } catch {
    return null;
  }
};

export const isYouTube = (url: string): boolean => ["youtube.com", "youtu.be", "youtube-nocookie.com"].includes(host(url) ?? "");

export function youtubeEmbed(url: string): Embed | null {
  if (!isYouTube(url)) return null;
  const u = new URL(url);
  const id = /^[\w-]{6,64}$/;
  if (host(url) === "youtu.be") {
    const v = u.pathname.slice(1);
    return id.test(v) ? { kind: "video", id: v } : null;
  }
  const v = u.searchParams.get("v");
  if (u.pathname === "/watch" && v && id.test(v)) return { kind: "video", id: v };
  const list = u.searchParams.get("list");
  if (u.pathname === "/playlist" && list && id.test(list)) return { kind: "playlist", id: list };
  const embedded = u.pathname.match(/^\/embed\/([\w-]{6,64})$/);
  return embedded ? { kind: "video", id: embedded[1] } : null;
}

/**
 * The privacy-enhanced player address. It loads only after the learner presses play,
 * so YouTube receives nothing from a visitor who never watches.
 */
export const embedSrc = (e: Embed): string =>
  e.kind === "video"
    ? `https://www.youtube-nocookie.com/embed/${e.id}?autoplay=1&rel=0`
    : `https://www.youtube-nocookie.com/embed/videoseries?list=${e.id}&autoplay=1&rel=0`;

const TYPE_LABEL: Record<string, string> = {
  course: "Course",
  video: "Video",
  article: "Article",
  book: "Book",
  repo: "Code repository",
  tool: "Tool",
  docs: "Documentation",
};

/**
 * What we call a resource, at the owner's request (2026-10-27): YouTube is a "Video lesson",
 * Google Skills paths are "Google's video lessons" (their badges are not certifications), and
 * other videos without a certificate are a "Short video lesson".
 */
export function kindLabel(r: { url: string; type: string; provider: string; certificate: boolean }): string {
  if (isYouTube(r.url)) return "Video lesson";
  if (r.provider === "Google Skills") return "Google's video lessons";
  if (r.type === "video" && !r.certificate) return "Short video lesson";
  return TYPE_LABEL[r.type] ?? "Resource";
}

/** The words on the button that opens it. */
export function openLabel(label: string): string {
  if (/video lesson/i.test(label)) return "Watch the video lesson";
  if (label === "Course") return "Open the course";
  if (label === "Article") return "Read the article";
  if (label === "Documentation") return "Read the docs";
  if (label === "Book") return "Open the book";
  return "Open it";
}
