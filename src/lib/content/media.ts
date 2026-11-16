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

/** A resource's player, or null when it cannot play here (not YouTube, or embedding turned off by the owner). */
export function resourceEmbed(r: { url: string; embeddable?: boolean }): Embed | null {
  return r.embeddable === false ? null : youtubeEmbed(r.url);
}

/**
 * The privacy-enhanced player address. It loads only after the learner presses play,
 * so YouTube receives nothing from a visitor who never watches.
 */
/**
 * VD-3: the sandbox on every YouTube player we embed. It allows what playback needs (scripts, the
 * player's own storage, fullscreen and picture-in-picture) and nothing that can take a learner off
 * our page: no pop-ups, so the YouTube logo, the title and "Watch on YouTube" do nothing when
 * clicked instead of opening youtube.com, and no navigating the page itself. Tested in a real
 * browser on 16 Nov 2026: with this sandbox those links opened 0 new tabs (3 without it) and
 * playback started the same way.
 */
export const PLAYER_SANDBOX = "allow-scripts allow-same-origin allow-presentation";

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
export function kindLabel(r: { url: string; type: string; provider: string; certificate: boolean; tags?: string[] }): string {
  // Owner's label for Google Skills paths wins, even when a path is also listed as a video course (VD-2).
  if (r.provider === "Google Skills") return "Google's video lessons";
  // VD-2: a whole course taught on video, such as a DeepLearning.AI short course or a lecture series.
  if (r.tags?.includes("video-course")) return "Video course";
  if (isYouTube(r.url)) return "Video lesson";
  if (r.type === "video" && !r.certificate) return "Short video lesson";
  return TYPE_LABEL[r.type] ?? "Resource";
}

/** The words on the button that opens it. */
export function openLabel(label: string): string {
  if (/video lesson/i.test(label)) return "Watch the video lesson";
  if (label === "Course") return "Open the course";
  if (label === "Video course") return "Start the course";
  if (label === "Article") return "Read the article";
  if (label === "Documentation") return "Read the docs";
  if (label === "Book") return "Open the book";
  return "Open it";
}
