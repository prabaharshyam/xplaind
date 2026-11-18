// ED-5 (2026-11-18, owner request: "build the weekly link checker"): the rules of the weekly link check.
// Pure: no network, no files. scripts/check-links.ts does the fetching and writing.

export type LinkStatus = "ok" | "broken" | "unknown";

/**
 * A response code, or null for a timeout or network error, as a status. 2xx and 3xx are ok; 404 and 410
 * are broken; anything else (403, 429, 5xx, a timeout) is unknown, because many sites block bots, and
 * unknown is never shown to learners as broken.
 */
export function classify(code: number | null): LinkStatus {
  if (code === null) return "unknown";
  if (code >= 200 && code < 400) return "ok";
  if (code === 404 || code === 410) return "broken";
  return "unknown";
}

/** Unknown results in a row after this check: three or more puts the link in the review queue. */
export const UNKNOWN_FOR_REVIEW = 3;
export const nextStreak = (status: LinkStatus, before: number | undefined): number => (status === "unknown" ? (before ?? 0) + 1 : 0);

/** Every web link in a content file's text, without trailing punctuation. Our own site and /go are left out. */
export function linksIn(text: string): string[] {
  const found = text.match(/https?:\/\/[^\s"'<>`)\]|]+/g) ?? [];
  return [
    ...new Set(
      found
        .map((u) => u.replace(/[.,;:!?*]+$/, ""))
        .filter((u) => {
          try {
            const host = new URL(u).hostname;
            return !/(^|\.)xplaind\.in$/.test(host) && host !== "localhost" && host.includes(".");
          } catch {
            return false;
          }
        }),
    ),
  ];
}

/** A YouTube video id, when the link is to one video (checked through YouTube's oEmbed, which 404s a removed video). */
export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export type LinkRecord = { status: LinkStatus; checked_on: string; code?: number | null; unknown_streak?: number; files?: string[] };

/** The issue text: broken links first, then the review queue. Empty when there is nothing to fix. */
export function report(links: Record<string, LinkRecord>, checkedOn: string): string {
  const rows = Object.entries(links);
  const broken = rows.filter(([, r]) => r.status === "broken");
  const review = rows.filter(([, r]) => r.status === "unknown" && (r.unknown_streak ?? 0) >= UNKNOWN_FOR_REVIEW);
  if (!broken.length && !review.length) return "";
  const line = ([url, r]: [string, LinkRecord]) => `- ${url} (${r.code ?? "no answer"}) in ${(r.files ?? []).map((f) => `\`${f}\``).join(", ")}`;
  const ok = rows.filter(([, r]) => r.status === "ok").length;
  const unknown = rows.filter(([, r]) => r.status === "unknown").length;
  return [
    `Weekly link check, ${checkedOn}: ${rows.length} links, ${ok} ok, ${broken.length} broken, ${unknown} unknown.`,
    broken.length ? `\n## Broken (fix or replace)\n\n${broken.map(line).join("\n")}` : "",
    review.length ? `\n## Review queue (no clear answer ${UNKNOWN_FOR_REVIEW} weeks in a row; open each by hand)\n\n${review.map(line).join("\n")}` : "",
    "\nThis issue is updated by the weekly link check (.github/workflows/link-check.yml). It closes itself when nothing is broken.",
  ]
    .filter(Boolean)
    .join("\n");
}
